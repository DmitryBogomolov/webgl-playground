import type {
    PrimitiveRuntime, PrimitiveParams, PrimitiveConfig, INDEX_TYPE, PRIMITIVE_MODE,
} from './primitive.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Program } from './program';
import type { GLValuesMap } from './gl-values-map.types';
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
    private _indexOffset: number = 0;
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

    /** Setup attributes, vertex and index data, primitive mode, index range */
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
        const { attributes } = config.vertexSchema;
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
        this._setIndexRange(indexDataLength);
    }

    /** Reset vertex data */
    setVertexData(vertexData: BufferSource | number): void {
        this._logMethod('set_vertex_data', isBufferSource(vertexData) ? vertexData.byteLength : vertexData);
        this._runtime.bindArrayBuffer(this._vertexBuffer);
        this._runtime.gl().bufferData(GL_ARRAY_BUFFER, vertexData as number, GL_STATIC_DRAW);
    }

    /** Reset index data */
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
        this._setIndexRange(indexDataLength);
    }

    private _setIndexRange(byteLength: number): void {
        this._indexOffset = 0;
        this._indexCount = byteLength / INDEX_SIZE_MAP[this._indexType];
    }

    /** Change part of vertex data */
    updateVertexData(vertexData: BufferSource, offset: number = 0): void {
        this._logMethod('update_vertex_data', toArgStr({ vertexData: vertexData.byteLength, offset }));
        const gl = this._runtime.gl();
        this._runtime.bindArrayBuffer(this._vertexBuffer);
        gl.bufferSubData(GL_ARRAY_BUFFER, offset, vertexData);
    }

    /** Change part of index data */
    updateIndexData(indexData: BufferSource, offset: number = 0): void {
        this._logMethod('update_index_data', toArgStr({ indexData: indexData.byteLength, offset }));
        const gl = this._runtime.gl();
        // Vertex array object must be bound because element array binding is part of its state.
        this._runtime.bindVertexArrayObject(this._vao);
        gl.bufferSubData(GL_ELEMENT_ARRAY_BUFFER, offset, indexData);
        this._runtime.bindVertexArrayObject(null);
    }

    /** Change index range */
    updateIndexRange(indexOffset: number, indexCount: number): void {
        if (indexOffset < 0 || indexCount < 0) {
            throw this._logMethodError(
                'update_index_range',
                toArgStr({ offset: indexOffset, count: indexCount }),
                'bad values',
            );
        }
        this._logMethod('update_index_range', toArgStr({ offset: indexOffset, count: indexCount }));
        this._indexOffset = indexOffset;
        this._indexCount = indexCount;
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
            throw this._logMethodError('render', '_', 'cannot render without program');
        }
        this._logMethod('render', '');
        this._runtime.useProgram(this._program);
        this._runtime.bindVertexArrayObject(this._vao);
        gl.drawElements(this._primitiveMode, this._indexCount, this._indexType, this._indexOffset);
        this._runtime.bindVertexArrayObject(null);
    }
}

function isBufferSource(arg: unknown): arg is BufferSource {
    return !!arg && (arg as BufferSource).byteLength >= 0;
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
