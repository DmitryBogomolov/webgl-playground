import type {
    PrimitiveParams, PrimitiveRuntime,
    PrimitiveVertexSchema, VERTEX_ATTRIBUTE_TYPE, VertexAttributeInfo,
    PrimitiveIndexConfig, INDEX_TYPE, PRIMITIVE_MODE,
} from './primitive.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Program } from './program';
import type { GLValuesMap } from './gl-values-map.types';
import type { Mapping } from '../common/mapping.types';
import { BaseObject } from './base-object';
import { toArgStr } from '../utils/string-formatter';

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

const ATTRIBUTE_TYPE_MAP: Mapping<VERTEX_ATTRIBUTE_TYPE, { type: number, rank: number, size: number }> = {
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
const DEFAULT_INDEX_TYPE: INDEX_TYPE = 'ushort';

export class Primitive extends BaseObject {
    private readonly _runtime: PrimitiveRuntime;
    private readonly _vao: VertexArrayObject;
    private readonly _vertexBuffer: Buffer;
    private readonly _indexBuffer: Buffer;
    private _vertexBufferSize: number = 0;
    private _indexBufferSize: number = 0;
    private _attributes: VertexAttributeInfo[] = [];
    private _primitiveMode: number = PRIMITIVE_MODE_MAP[DEFAULT_PRIMITIVE_MODE];
    private _indexCount: number = 0;
    private _indexOffset: number = 0;
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

    allocateVertexBuffer(size: number): void {
        if (size < 0) {
            throw this._logMethodError('allocate_vertex_buffer', size, 'bad value');
        }
        this._logMethod('allocate_vertex_buffer', size);
        const gl = this._runtime.gl();
        this._vertexBufferSize = size;
        this._runtime.bindArrayBuffer(this._vertexBuffer);
        gl.bufferData(GL_ARRAY_BUFFER, this._vertexBufferSize, GL_STATIC_DRAW);
    }

    allocateIndexBuffer(size: number): void {
        if (size < 0) {
            throw this._logMethodError('allocate_index_buffer', size, 'bad value');
        }
        this._logMethod('allocate_index_buffer', size);
        const gl = this._runtime.gl();
        this._indexBufferSize = size;
        // Vertex array object must also be bound because element array buffer should not be bound without it.
        this._runtime.bindVertexArrayObject(this._vao);
        this._runtime.bindElementArrayBuffer(this._indexBuffer);
        gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, this._indexBufferSize, GL_STATIC_DRAW);
        this._runtime.bindVertexArrayObject(null);
    }

    updateVertexData(vertexData: BufferSource, offset: number = 0): void {
        this._logMethod('update_vertex_data', `offset=${offset}, bytes=${vertexData.byteLength}`);
        const gl = this._runtime.gl();
        this._runtime.bindArrayBuffer(this._vertexBuffer);
        gl.bufferSubData(GL_ARRAY_BUFFER, offset, vertexData);
    }

    updateIndexData(indexData: BufferSource, offset: number = 0): void {
        this._logMethod('update_index_data', `offset=${offset}, bytes=${indexData.byteLength}`);
        const gl = this._runtime.gl();
        // Vertex array object must also be bound because element array buffer should not be bound without it.
        this._runtime.bindVertexArrayObject(this._vao);
        this._runtime.bindElementArrayBuffer(this._indexBuffer);
        gl.bufferSubData(GL_ELEMENT_ARRAY_BUFFER, offset, indexData);
        this._runtime.bindVertexArrayObject(null);
    }

    setVertexSchema(schema: PrimitiveVertexSchema): void {
        if (!schema) {
            throw this._logMethodError('set_vertex_schema', '_', 'not defined');
        }
        this._logMethod('set_vertex_schema', `attributes=${schema.attributes.length}`);
        this._attributes = validateVertexSchema(schema);
        const gl = this._runtime.gl();
        try {
            this._runtime.bindVertexArrayObject(this._vao);
            this._runtime.bindArrayBuffer(this._vertexBuffer);
            for (const attr of this._attributes) {
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
        } finally {
            this._runtime.bindVertexArrayObject(null);
        }
    }

    setIndexConfig(config: PrimitiveIndexConfig): void {
        if (!config) {
            throw this._logMethodError('set_index_config', '_', 'not defined');
        }
        const { indexCount, indexOffset, indexType, primitiveMode } = config;
        this._logMethod('set_index_config', toArgStr(config));
        if (indexCount < 0) {
            throw this._logError(`bad index count: ${indexCount}`);
        }
        this._indexCount = indexCount;
        if (indexOffset !== undefined) {
            if (indexOffset < 0) {
                throw this._logError(`bad index offset: ${indexOffset}`);
            }
            this._indexOffset = indexOffset;
        }
        if (indexType !== undefined) {
            const value = INDEX_TYPE_MAP[indexType];
            if (value === undefined) {
                throw this._logError(`bad index type: ${indexType}`);
            }
            this._indexType = value;
        }
        if (primitiveMode !== undefined) {
            const value = PRIMITIVE_MODE_MAP[primitiveMode];
            if (value === undefined) {
                throw this._logError(`bad primitive mode: ${primitiveMode}`);
            }
            this._primitiveMode = value;
        }
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

    render(): void {
        const gl = this._runtime.gl();
        if (this._program === EMPTY_PROGRAM) {
            throw this._logError('cannot render without program');
        }
        this._logMethod('render', '');
        this._runtime.useProgram(this._program);
        this._runtime.bindVertexArrayObject(this._vao);
        gl.drawElements(this._primitiveMode, this._indexCount, this._indexType, this._indexOffset);
        this._runtime.bindVertexArrayObject(null);
    }
}

export function validateVertexSchema(schema: PrimitiveVertexSchema): VertexAttributeInfo[] {
    let currentOffset = 0;
    const list: VertexAttributeInfo[] = [];
    for (let i = 0; i < schema.attributes.length; ++i) {
        const attribute = schema.attributes[i];
        const location = attribute.location !== undefined ? attribute.location : i;
        if (location < 0) {
            throw new Error(`attribute ${i}: bad location: ${location}`);
        }
        const typeInfo = ATTRIBUTE_TYPE_MAP[attribute.type];
        if (!typeInfo) {
            throw new Error(`attribute ${i}: bad type: ${attribute.type}`);
        }
        const offset = attribute.offset !== undefined ? attribute.offset : currentOffset;
        if (attribute.offset === undefined) {
            currentOffset += align(typeInfo.rank * typeInfo.size);
        }
        if (offset !== 0 && (offset % typeInfo.size !== 0)) {
            throw new Error(`attribute ${i}: bad offset ${offset} for ${attribute.type}`);
        }
        const stride = attribute.stride !== undefined ? attribute.stride : 0;
        if (stride !== 0 && (stride % typeInfo.size !== 0 || stride < typeInfo.rank * typeInfo.size)) {
            throw new Error(`attribute ${i}: bad stride ${stride} for ${attribute.type}`);
        }
        const normalized = typeInfo.type !== WebGL.FLOAT && Boolean(attribute.normalized);
        list.push({
            location,
            ...typeInfo,
            offset,
            stride,
            normalized,
        });
    }
    for (let i = 0; i < list.length; ++i) {
        const item = list[i];
        if (item.stride === 0) {
            list[i] = { ...item, stride: currentOffset };
        }
    }
    return list;
}

function align(bytes: number): number {
    const residue = bytes % 4;
    return residue === 0 ? bytes : bytes + (4 - residue);
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
