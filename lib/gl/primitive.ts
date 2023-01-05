import type { PRIMITIVE_MODE, INDEX_TYPE, IndexData, PrimitiveRuntime } from './types/primitive';
import type { VertexSchema } from './types/vertex-schema';
import type { GLValuesMap } from './types/gl-values-map';
import type { Program } from './program';
import { BaseWrapper } from './base-wrapper';
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
    schema() { return EMPTY_SCHEMA; },
    setUniform() { /* empty */ },
} as Pick<Program, 'dispose' | 'id' | 'glHandle' | 'schema' | 'setUniform'> as unknown as Program;

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
    'u8': WebGL.UNSIGNED_BYTE,
    'u16': WebGL.UNSIGNED_SHORT,
    'u32': WebGL.UNSIGNED_INT,
};
const DEFAULT_INDEX_TYPE: INDEX_TYPE = 'u16';

export class Primitive extends BaseWrapper {
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
        super(tag);
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
        if (size <= 0) {
            throw this._logger.error('allocate_vertex_buffer({0}): bad value', size);
        }
        this._logger.log('allocate_vertex_buffer({0})', size);
        const gl = this._runtime.gl();
        this._vertexBufferSize = size;
        this._runtime.bindArrayBuffer(wrap(this._id, this._vertexBuffer));
        gl.bufferData(GL_ARRAY_BUFFER, this._vertexBufferSize, GL_STATIC_DRAW);
    }

    allocateIndexBuffer(size: number): void {
        if (size <= 0) {
            throw this._logger.error('allocate_index_buffer({0}): bad value', size);
        }
        this._logger.log('allocate_index_buffer({0})', size);
        const gl = this._runtime.gl();
        this._indexBufferSize = size;
        this._runtime.bindElementArrayBuffer(wrap(this._id, this._indexBuffer));
        gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, this._indexBufferSize, GL_STATIC_DRAW);
    }

    updateVertexData(vertexData: BufferSource, offset: number = 0): void {
        this._logger.log('update_vertex_data(offset={1}, bytes={0})', vertexData.byteLength, offset);
        const gl = this._runtime.gl();
        this._runtime.bindArrayBuffer(wrap(this._id, this._vertexBuffer));
        gl.bufferSubData(GL_ARRAY_BUFFER, offset, vertexData);
    }

    updateIndexData(indexData: BufferSource, offset: number = 0): void {
        this._logger.log('update_index_data(offset={1}, bytes={0})', indexData.byteLength, offset);
        const gl = this._runtime.gl();
        this._runtime.bindElementArrayBuffer(wrap(this._id, this._indexBuffer));
        gl.bufferSubData(GL_ELEMENT_ARRAY_BUFFER, offset, indexData);
    }

    setVertexSchema(schema: VertexSchema | null): void {
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

    setIndexData({ indexCount, indexOffset, indexType, primitiveMode }: IndexData): void {
        this._logger.log('set_index_data(count={0}, offset={1}, type={2}, mode={3})',
            indexCount, indexOffset, indexType, primitiveMode);
        if (indexCount < 0) {
            throw this._logger.error('bad index count: {0}', indexCount);
        }
        this._indexCount = indexCount;
        if (indexOffset !== undefined) {
            if (indexOffset < 0) {
                throw this._logger.error('bad index offset: {0}', indexOffset);
            }
            this._indexOffset = indexOffset;
        }
        if (indexType !== undefined) {
            const value = INDEX_TYPE_MAP[indexType];
            if (value === undefined) {
                throw this._logger.error('bad index type: {0}', indexType);
            }
            this._indexType = value;
        }
        if (primitiveMode !== undefined) {
            const value = PRIMITIVE_MODE_MAP[primitiveMode];
            if (value === undefined) {
                throw this._logger.error('bad primitive mode: {0}', primitiveMode);
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
        const _program = program || EMPTY_PROGRAM;
        if (this._program === program) {
            return;
        }
        this._logger.log('set_program({0})', _program.id());
        if (_program.schema() !== this._schema) {
            throw this._logger.error('program schema does not match');
        }
        this._program = _program;
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
