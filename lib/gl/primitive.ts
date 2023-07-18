import type {
    PrimitiveVertexSchema, VERTEX_ATTRIBUTE_TYPE,
    PrimitiveIndexConfig, INDEX_TYPE, PRIMITIVE_MODE,
    PrimitiveRuntime,
    VertexAttributeInfo,
} from './primitive.types';
import type { VertexSchema } from './vertex-schema.types';
import type { GLValuesMap } from './gl-values-map.types';
import type { Program } from './program';
import { BaseDisposable } from '../common/base-disposable';
import { wrap } from './gl-handle-wrapper';

const WebGL = WebGLRenderingContext.prototype;

const GL_ARRAY_BUFFER = WebGL.ARRAY_BUFFER;
const GL_ELEMENT_ARRAY_BUFFER = WebGL.ELEMENT_ARRAY_BUFFER;
const GL_STATIC_DRAW = WebGL.STATIC_DRAW;

const EMPTY_SCHEMA: VertexSchema = {
    attributes: [],
    totalSize: -1,
};

const EMPTY_PROGRAM = {
    dispose() { /* empty */ },
    id() { return 'EMPTY_PROGRAM'; },
    glHandle() { return null as unknown as WebGLProgram; },
    setUniform() { /* empty */ },
} as Pick<Program, 'dispose' | 'id' | 'glHandle' | 'setUniform'> as unknown as Program;

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

const ATTRIBUTE_TYPE_MAP: Readonly<Record<VERTEX_ATTRIBUTE_TYPE, { type: number, rank: number, size: number }>> = {
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
    'u8': WebGL.UNSIGNED_BYTE,
    'u16': WebGL.UNSIGNED_SHORT,
    'u32': WebGL.UNSIGNED_INT,
};
const DEFAULT_INDEX_TYPE: INDEX_TYPE = 'u16';

export class Primitive extends BaseDisposable {
    private readonly _runtime: PrimitiveRuntime;
    private readonly _vao: WebGLVertexArrayObjectOES;
    private readonly _vertexBuffer: WebGLBuffer;
    private readonly _indexBuffer: WebGLBuffer;
    private _vertexBufferSize: number = 0;
    private _indexBufferSize: number = 0;
    private _schema: VertexSchema = EMPTY_SCHEMA;
    private _primitiveMode: number = PRIMITIVE_MODE_MAP[DEFAULT_PRIMITIVE_MODE];
    private _indexCount: number = 0;
    private _indexOffset: number = 0;
    private _indexType: number = INDEX_TYPE_MAP[DEFAULT_INDEX_TYPE];
    private _program: Program = EMPTY_PROGRAM;

    constructor(runtime: PrimitiveRuntime, tag?: string) {
        super(runtime.logger(), tag);
        this._logger.log('init');
        this._runtime = runtime;
        this._vao = this._createVao();
        this._vertexBuffer = this._createBuffer();
        this._indexBuffer = this._createBuffer();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl().deleteBuffer(this._vertexBuffer);
        this._runtime.gl().deleteBuffer(this._indexBuffer);
        this._runtime.vaoExt().deleteVertexArrayOES(this._vao);
        this._emitDisposed();
    }

    private _createVao(): WebGLVertexArrayObjectOES {
        const vao = this._runtime.vaoExt().createVertexArrayOES();
        if (!vao) {
            throw this._logger.error('failed to create vertex array object');
        }
        return vao;
    }

    private _createBuffer(): WebGLBuffer {
        const buffer = this._runtime.gl().createBuffer();
        if (!buffer) {
            throw this._logger.error('failed to create buffer');
        }
        return buffer;
    }

    allocateVertexBuffer(size: number): void {
        if (size < 0) {
            throw this._logger.error(`allocate_vertex_buffer(${size}): bad value`);
        }
        this._logger.log(`allocate_vertex_buffer(${size})`);
        const gl = this._runtime.gl();
        this._vertexBufferSize = size;
        this._runtime.bindArrayBuffer(wrap(this._id, this._vertexBuffer));
        gl.bufferData(GL_ARRAY_BUFFER, this._vertexBufferSize, GL_STATIC_DRAW);
    }

    allocateIndexBuffer(size: number): void {
        if (size < 0) {
            throw this._logger.error(`allocate_index_buffer(${size}): bad value`);
        }
        this._logger.log(`allocate_index_buffer(${size})`);
        const gl = this._runtime.gl();
        this._indexBufferSize = size;
        this._runtime.bindElementArrayBuffer(wrap(this._id, this._indexBuffer));
        gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, this._indexBufferSize, GL_STATIC_DRAW);
    }

    updateVertexData(vertexData: BufferSource, offset: number = 0): void {
        this._logger.log(`update_vertex_data(offset=${offset}, bytes=${vertexData.byteLength})`);
        const gl = this._runtime.gl();
        this._runtime.bindArrayBuffer(wrap(this._id, this._vertexBuffer));
        gl.bufferSubData(GL_ARRAY_BUFFER, offset, vertexData);
    }

    updateIndexData(indexData: BufferSource, offset: number = 0): void {
        this._logger.log(`update_index_data(offset=${offset}, bytes=${indexData.byteLength})`);
        const gl = this._runtime.gl();
        this._runtime.bindElementArrayBuffer(wrap(this._id, this._indexBuffer));
        gl.bufferSubData(GL_ELEMENT_ARRAY_BUFFER, offset, indexData);
    }

    setVertexSchema(schema: VertexSchema | null): void {
        if ('attrs' in (schema as unknown as PrimitiveVertexSchema)) {
            this.setVertexSchema_TODO(schema as unknown as PrimitiveVertexSchema);
            return;
        }

        const _schema = schema || EMPTY_SCHEMA;
        if (this._schema === _schema) {
            return;
        }
        this._logger.log('set_vertex_schema(attributes={0}, size={1})', _schema.attributes.length, _schema.totalSize);
        this._schema = _schema;
        const gl = this._runtime.gl();
        try {
            this._runtime.bindVertexArrayObject(wrap(this._id, this._vao));
            this._runtime.bindArrayBuffer(wrap(this._id, this._vertexBuffer));
            for (const attr of _schema.attributes) {
                gl.vertexAttribPointer(
                    attr.location, attr.size, attr.gltype, attr.normalized, attr.stride, attr.offset,
                );
                gl.enableVertexAttribArray(attr.location);
            }
            this._runtime.bindElementArrayBuffer(wrap(this._id, this._indexBuffer));
        } finally {
            this._runtime.bindVertexArrayObject(null);
        }
    }

    setVertexSchema_TODO(schema: PrimitiveVertexSchema): void {
        if (!schema) {
            throw this._logger.error('set_vertex_schema: not defined');
        }
        const attrInfoList = validateVertexSchema(schema);
        this._logger.log(`set_vertex_schema(attributes=${schema.attrs.length})`);
        const gl = this._runtime.gl();
        try {
            this._runtime.bindVertexArrayObject(wrap(this._id, this._vao));
            this._runtime.bindArrayBuffer(wrap(this._id, this._vertexBuffer));
            for (let i = 0; i < schema.attrs.length; ++i) {
                const attrInfo = attrInfoList[i];
                gl.vertexAttribPointer(
                    attrInfo.location, attrInfo.rank, attrInfo.type,
                    attrInfo.normalized, attrInfo.stride, attrInfo.offset,
                );
                gl.enableVertexAttribArray(attrInfo.location);
            }
            this._runtime.bindElementArrayBuffer(wrap(this._id, this._indexBuffer));
        } finally {
            this._runtime.bindVertexArrayObject(null);
        }
    }

    setIndexConfig(config: PrimitiveIndexConfig): void {
        if (!config) {
            throw this._logger.error('set_index_config: not defined');
        }
        const { indexCount, indexOffset, indexType, primitiveMode } = config;
        this._logger.log(
            `set_index_config:(count=${indexCount}, offset=${indexOffset}, type=${indexType}, mode=${primitiveMode})`);
        if (indexCount < 0) {
            throw this._logger.error(`bad index count: ${indexCount}`);
        }
        this._indexCount = indexCount;
        if (indexOffset !== undefined) {
            if (indexOffset < 0) {
                throw this._logger.error(`bad index offset: ${indexOffset}`);
            }
            this._indexOffset = indexOffset;
        }
        if (indexType !== undefined) {
            const value = INDEX_TYPE_MAP[indexType];
            if (value === undefined) {
                throw this._logger.error(`bad index type: ${indexType}`);
            }
            this._indexType = value;
        }
        if (primitiveMode !== undefined) {
            const value = PRIMITIVE_MODE_MAP[primitiveMode];
            if (value === undefined) {
                throw this._logger.error(`bad primitive mode: ${primitiveMode}`);
            }
            this._primitiveMode = value;
        }
    }

    schema(): VertexSchema {
        return this._schema;
    }

    program(): Program {
        return this._program;
    }

    setProgram(program: Program | null): void {
        const prog = program || EMPTY_PROGRAM;
        if (this._program === program) {
            return;
        }
        this._logger.log(`set_program(${prog.id()})`);
        // if (_program.schema() !== this._schema) {
        //     throw this._logger.error('program schema does not match');
        // }
        this._program = prog;
    }

    render(): void {
        const gl = this._runtime.gl();
        if (this._program === EMPTY_PROGRAM) {
            this._logger.warn('render without program');
            return;
        }
        this._runtime.useProgram(this._program);
        this._runtime.bindVertexArrayObject(wrap(this._id, this._vao));
        gl.drawElements(this._primitiveMode, this._indexCount, this._indexType, this._indexOffset);
        this._runtime.bindVertexArrayObject(null);
    }
}

export function validateVertexSchema(schema: PrimitiveVertexSchema): VertexAttributeInfo[] {
    let currentOffset = 0;
    const list: VertexAttributeInfo[] = [];
    for (let i = 0; i < schema.attrs.length; ++i) {
        const attribute = schema.attrs[i];
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
        if (offset % typeInfo.size !== 0) {
            throw new Error(`attribute ${i}: bad offset ${offset} for ${attribute.type}`);
        }
        const stride = attribute.stride !== undefined ? attribute.stride : 0;
        if (stride % (typeInfo.rank * typeInfo.size) !== 0) {
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
