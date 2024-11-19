import type {
    PrimitiveParams, PrimitiveRuntime,
    PrimitiveConfig,
    VertexSchemaDefinition, VertexAttributeInfo, VertexSchemaInfo,
    VERTEX_ATTRIBUTE_TYPE, INDEX_TYPE, PRIMITIVE_MODE,
} from './primitive.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Program } from './program';
import type { GLValuesMap } from './gl-values-map.types';
import type { Mapping } from '../common/mapping.types';
import { BaseObject } from './base-object';
import { toStr, toArgStr } from '../utils/string-formatter';

const WebGL = WebGLRenderingContext.prototype;

const GL_ARRAY_BUFFER = WebGL.ARRAY_BUFFER;
const GL_ELEMENT_ARRAY_BUFFER = WebGL.ELEMENT_ARRAY_BUFFER;
const GL_STATIC_DRAW = WebGL.STATIC_DRAW;

const EMPTY_PROGRAM = {
    dispose() { /* empty */ },
    toString() { return 'EMPTY_PROGRAM'; },
    glHandle() { return null as unknown as WebGLProgram; },
    setUniform() { /* empty */ },
} as Pick<Program, 'dispose' | 'toString' | 'glHandle' | 'setUniform'> as unknown as Program;

const PRIMITIVE_MODE_MAP: GLValuesMap<PRIMITIVE_MODE> = {
    'points': WebGL.POINTS,
    'line_strip': WebGL.LINE_STRIP,
    'line_loop': WebGL.LINE_LOOP,
    'lines': WebGL.LINES,
    'triangle_strip': WebGL.TRIANGLE_STRIP,
    'triangle_fan': WebGL.TRIANGLE_FAN,
    'triangles': WebGL.TRIANGLES,
};
const DEFAULT_PRIMITIVE_MODE: PRIMITIVE_MODE = 'triangles';

interface TypeInfo {
    readonly type: number;
    readonly rank: number;
    readonly size: number;
}

const ATTRIBUTE_TYPE_MAP: Mapping<VERTEX_ATTRIBUTE_TYPE, TypeInfo> = {
    'byte': { type: WebGL.BYTE, rank: 1, size: 1 },
    'byte2': { type: WebGL.BYTE, rank: 2, size: 1 },
    'byte3': { type: WebGL.BYTE, rank: 3, size: 1 },
    'byte4': { type: WebGL.BYTE, rank: 4, size: 1 },
    'ubyte': { type: WebGL.UNSIGNED_BYTE, rank: 1, size: 1 },
    'ubyte2': { type: WebGL.UNSIGNED_BYTE, rank: 2, size: 1 },
    'ubyte3': { type: WebGL.UNSIGNED_BYTE, rank: 3, size: 1 },
    'ubyte4': { type: WebGL.UNSIGNED_BYTE, rank: 4, size: 1 },
    'short': { type: WebGL.SHORT, rank: 1, size: 2 },
    'short2': { type: WebGL.SHORT, rank: 2, size: 2 },
    'short3': { type: WebGL.SHORT, rank: 3, size: 2 },
    'short4': { type: WebGL.SHORT, rank: 4, size: 2 },
    'ushort': { type: WebGL.UNSIGNED_SHORT, rank: 1, size: 2 },
    'ushort2': { type: WebGL.UNSIGNED_SHORT, rank: 2, size: 2 },
    'ushort3': { type: WebGL.UNSIGNED_SHORT, rank: 3, size: 2 },
    'ushort4': { type: WebGL.UNSIGNED_SHORT, rank: 4, size: 2 },
    'int': { type: WebGL.INT, rank: 1, size: 4 },
    'int2': { type: WebGL.INT, rank: 2, size: 4 },
    'int3': { type: WebGL.INT, rank: 3, size: 4 },
    'int4': { type: WebGL.INT, rank: 4, size: 4 },
    'uint': { type: WebGL.UNSIGNED_INT, rank: 1, size: 4 },
    'uint2': { type: WebGL.UNSIGNED_INT, rank: 2, size: 4 },
    'uint3': { type: WebGL.UNSIGNED_INT, rank: 3, size: 4 },
    'uint4': { type: WebGL.UNSIGNED_INT, rank: 4, size: 4 },
    'float': { type: WebGL.FLOAT, rank: 1, size: 4 },
    'float2': { type: WebGL.FLOAT, rank: 2, size: 4 },
    'float3': { type: WebGL.FLOAT, rank: 3, size: 4 },
    'float4': { type: WebGL.FLOAT, rank: 4, size: 4 },
};

const INDEX_TYPE_MAP: GLValuesMap<INDEX_TYPE> = {
    'ubyte': WebGL.UNSIGNED_BYTE,
    'ushort': WebGL.UNSIGNED_SHORT,
    'uint': WebGL.UNSIGNED_INT,
};
const INDEX_SIZE_MAP: Readonly<Record<number, number>> = {
    [WebGL.UNSIGNED_BYTE]: 1,
    [WebGL.UNSIGNED_SHORT]: 2,
    [WebGL.UNSIGNED_INT]: 4,
};
const DEFAULT_INDEX_TYPE: INDEX_TYPE = 'ushort';

export class Primitive extends BaseObject {
    private readonly _runtime: PrimitiveRuntime;
    private readonly _vao: VertexArrayObject;
    private readonly _vertexBuffer: Buffer;
    private readonly _indexBuffer: Buffer;
    private _primitiveMode: number = PRIMITIVE_MODE_MAP[DEFAULT_PRIMITIVE_MODE];
    private _indexCount: number = 0;
    private _indexType: number = INDEX_TYPE_MAP[DEFAULT_INDEX_TYPE];
    private _program: Program = EMPTY_PROGRAM;

    constructor(params: PrimitiveParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._logMethod('init', '');
        this._runtime = params.runtime;
        this._vao = new VertexArrayObject(this._runtime, this._id);
        this._vertexBuffer = new Buffer(this._runtime, this._id);
        this._indexBuffer = new Buffer(this._runtime, this._id);
    }

    dispose(): void {
        this._logMethod('dispose', '');
        this._dispose();
        this._vao.dispose();
        this._vertexBuffer.dispose();
        this._indexBuffer.dispose();
    }

    setup(config: PrimitiveConfig): void {
        if (!config) {
            throw this._logMethodError('setup', '_', 'not defined');
        }
        const { vertexData, indexData } = config;
        this._logMethod('setup', toArgStr({
            vertexData: isBufferSource(vertexData) ? vertexData.byteLength : vertexData,
            indexData: isBufferSource(indexData) ? indexData.byteLength : indexData,
            schema: toStr(config.vertexSchema.attributes),
            indexType: config.indexType,
            primitiveMode: config.primitiveMode,
        }));
        // TODO_THIS: Accept VertexSchemaInfo.
        const { attributes } = validateVertexSchema(config.vertexSchema);
        const gl = this._runtime.gl();
        try {
            this._runtime.bindVertexArrayObject(this._vao);
            this._runtime.bindArrayBuffer(this._vertexBuffer);
            for (const attr of attributes) {
                gl.vertexAttribPointer(
                    attr.location,
                    attr.rank,
                    attr.type,
                    attr.normalized,
                    attr.stride,
                    attr.offset,
                );
                gl.enableVertexAttribArray(attr.location);
            }
            this._runtime.bindElementArrayBuffer(this._indexBuffer);

            gl.bufferData(GL_ARRAY_BUFFER, vertexData as number, GL_STATIC_DRAW);
            gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, indexData as number, GL_STATIC_DRAW);
        } finally {
            this._runtime.bindVertexArrayObject(null);
        }
        this._primitiveMode = PRIMITIVE_MODE_MAP[config.primitiveMode || DEFAULT_PRIMITIVE_MODE];
        this._indexType = INDEX_TYPE_MAP[config.indexType || DEFAULT_INDEX_TYPE];
        const indexDataLength = isBufferSource(indexData) ? indexData.byteLength : indexData;
        this._indexCount = indexDataLength / INDEX_SIZE_MAP[this._indexType];
    }

    setVertexData(vertexData: BufferSource | number): void {
        this._logMethod('set_vertex_data', isBufferSource(vertexData) ? vertexData.byteLength : vertexData);
        this._runtime.bindArrayBuffer(this._vertexBuffer);
        this._runtime.gl().bufferData(GL_ARRAY_BUFFER, vertexData as number, GL_STATIC_DRAW);
    }

    setIndexData(indexData: BufferSource | number): void {
        this._logMethod('set_index_data', isBufferSource(indexData) ? indexData.byteLength : indexData);
        try {
            // Vertex array object must be bound because element array binding is part of its state.
            this._runtime.bindVertexArrayObject(this._vao);
            this._runtime.gl().bufferData(GL_ELEMENT_ARRAY_BUFFER, indexData as number, GL_STATIC_DRAW);
        } finally {
            this._runtime.bindVertexArrayObject(null);
        }
        const indexDataLength = isBufferSource(indexData) ? indexData.byteLength : indexData;
        this._indexCount = indexDataLength / INDEX_SIZE_MAP[this._indexType];
    }

    updateVertexData(vertexData: BufferSource, offset: number = 0): void {
        this._logMethod('update_vertex_data', toArgStr({ vertexData: vertexData.byteLength, offset }));
        const gl = this._runtime.gl();
        this._runtime.bindArrayBuffer(this._vertexBuffer);
        gl.bufferSubData(GL_ARRAY_BUFFER, offset, vertexData);
    }

    updateIndexData(indexData: BufferSource, offset: number = 0): void {
        this._logMethod('update_index_data', toArgStr({ indexData: indexData.byteLength, offset }));
        const gl = this._runtime.gl();
        // Vertex array object must be bound because element array binding is part of its state.
        this._runtime.bindVertexArrayObject(this._vao);
        gl.bufferSubData(GL_ELEMENT_ARRAY_BUFFER, offset, indexData);
        this._runtime.bindVertexArrayObject(null);
    }

    program(): Program {
        return this._program;
    }

    setProgram(program: Program | null): void {
        const prog = program || EMPTY_PROGRAM;
        if (this._program === program) {
            return;
        }
        this._logMethod('set_program', prog);
        this._program = prog;
    }

    render(indexOffset: number = 0): void {
        const gl = this._runtime.gl();
        if (this._program === EMPTY_PROGRAM) {
            throw this._logError('cannot render without program');
        }
        this._logMethod('render', toArgStr({ indexOffset }));
        this._runtime.useProgram(this._program);
        this._runtime.bindVertexArrayObject(this._vao);
        gl.drawElements(this._primitiveMode, this._indexCount, this._indexType, indexOffset || 0);
        this._runtime.bindVertexArrayObject(null);
    }
}

function isBufferSource(arg: unknown): arg is BufferSource {
    return !!arg && (arg as BufferSource).byteLength >= 0;
}

export function validateVertexSchema(schema: VertexSchemaDefinition): VertexSchemaInfo {
    const list: VertexAttributeInfo[] = [];
    let currentOffset = 0;
    let totalSize = 0;
    const locations = new Set<number>();
    for (let i = 0; i < schema.attributes.length; ++i) {
        const attribute = schema.attributes[i];

        let { location, offset, stride } = attribute;
        if (location !== undefined) {
            if (location < 0) {
                throw new Error(`attribute ${i} - bad location: ${location}`);
            }
        } else {
            location = i;
        }
        if (locations.has(location)) {
            throw new Error(`attribute ${i} - duplicate location: ${location}`);
        }
        locations.add(location);

        const typeInfo = ATTRIBUTE_TYPE_MAP[attribute.type];
        if (!typeInfo) {
            throw new Error(`attribute ${i} - bad type: ${attribute.type}`);
        }
        const byteSize = getAttrByteSize(typeInfo);

        if (offset !== undefined) {
            if (offset < 0 || offset % typeInfo.size !== 0) {
                throw new Error(`attribute ${i} - bad offset ${offset}`);
            }
        } else {
            offset = -1;
        }

        if (stride !== undefined) {
            if (stride % typeInfo.size !== 0 || stride < byteSize) {
                throw new Error(`attribute ${i} - bad stride ${stride}`);
            }
            if (offset === -1) {
                throw new Error(`attribute ${i} - no offset`);
            }
        } else {
            stride = -1;
            if (offset === -1) {
                offset = currentOffset;
                currentOffset += byteSize;
            }
        }

        const normalized = isNormalizable(typeInfo) && Boolean(attribute.normalized);

        list.push({
            location,
            ...typeInfo,
            offset,
            stride,
            normalized,
        });
        totalSize += byteSize;
    }
    for (let i = 0; i < list.length; ++i) {
        const item = list[i];
        if (item.stride === -1) {
            // @ts-ignore Part of object initialization.
            item.stride = currentOffset;
        }
    }
    return { attributes: list, vertexSize: totalSize };
}

function align(bytes: number): number {
    const residue = bytes % 4;
    return residue === 0 ? bytes : bytes + (4 - residue);
}

function getAttrByteSize(typeInfo: TypeInfo): number {
    return align(typeInfo.rank * typeInfo.size);
}

function isNormalizable(typeInfo: TypeInfo): boolean {
    return typeInfo.type !== WebGL.FLOAT;
}

class VertexArrayObject implements GLHandleWrapper<WebGLVertexArrayObjectOES> {
    private readonly _runtime: PrimitiveRuntime;
    private readonly _id: string;
    private readonly _vao: WebGLVertexArrayObjectOES;

    constructor(runtime: PrimitiveRuntime, id: string) {
        this._runtime = runtime;
        this._id = id;
        const vao = this._runtime.vaoExt().createVertexArrayOES();
        if (!vao) {
            throw new Error('failed to create vertex array object');
        }
        this._vao = vao;
    }

    dispose(): void {
        this._runtime.vaoExt().deleteVertexArrayOES(this._vao);
    }

    toString(): string {
        return this._id;
    }

    glHandle(): WebGLVertexArrayObjectOES {
        return this._vao;
    }
}

class Buffer implements GLHandleWrapper<WebGLBuffer> {
    private readonly _runtime: PrimitiveRuntime;
    private readonly _id: string;
    private readonly _buffer: WebGLBuffer;

    constructor(runtime: PrimitiveRuntime, id: string) {
        this._runtime = runtime;
        this._id = id;
        const buffer = this._runtime.gl().createBuffer();
        if (!buffer) {
            throw new Error('failed to create buffer');
        }
        this._buffer = buffer;
    }

    dispose(): void {
        this._runtime.gl().deleteBuffer(this._buffer);
    }

    toString(): string {
        return this._id;
    }

    glHandle(): WebGLBuffer {
        return this._buffer;
    }
}
