import { Program, EMPTY_PROGRAM } from './program';
import { Runtime } from './runtime';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
    STATIC_DRAW, TRIANGLES, UNSIGNED_SHORT,
} = WebGLRenderingContext.prototype;

export class Primitive {
    private readonly _id = generateId('Primitive');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime;
    private readonly _vao: WebGLVertexArrayObjectOES;
    private readonly _vertexBuffer: WebGLBuffer;
    private readonly _indexBuffer: WebGLBuffer;
    private _vertexBufferSize = 0;
    private _indexBufferSize = 0;
    private _program: Program = EMPTY_PROGRAM;
    private _indexCount: number = 0;

    constructor(runtime: Runtime) {
        this._logger.log('init');
        this._runtime = runtime;
        this._vao = this._createVao();
        this._vertexBuffer = this._createBuffer();
        this._indexBuffer = this._createBuffer();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._runtime.gl.deleteBuffer(this._vertexBuffer);
        this._runtime.gl.deleteBuffer(this._indexBuffer);
        this._runtime.vaoExt.deleteVertexArrayOES(this._vao);
    }

    private _createVao(): WebGLVertexArrayObjectOES {
        const vao = this._runtime.vaoExt.createVertexArrayOES();
        if (!vao) {
            throw this._logger.error('failed to create vertex array object');
        }
        return vao;
    }

    private _createBuffer(): WebGLBuffer {
        const buffer = this._runtime.gl.createBuffer();
        if (!buffer) {
            throw this._logger.error('failed to create buffer');
        }
        return buffer;
    }

    allocateVertexBuffer(size: number): void {
        this._logger.log('allocate_vertex_buffer({0})', size);
        const gl = this._runtime.gl;
        this._vertexBufferSize = size;
        this._runtime.bindArrayBuffer(this._vertexBuffer, this._id);
        gl.bufferData(ARRAY_BUFFER, this._vertexBufferSize, STATIC_DRAW);
    }

    allocateIndexBuffer(size: number): void {
        this._logger.log('allocate_index_buffer({0})', size);
        const gl = this._runtime.gl;
        this._indexBufferSize = size;
        this._runtime.bindElementArrayBuffer(this._indexBuffer, this._id);
        gl.bufferData(ELEMENT_ARRAY_BUFFER, this._indexBufferSize, STATIC_DRAW);
    }

    updateVertexData(vertexData: BufferSource, offset: number = 0): void {
        this._logger.log('update_vertex_data(offset={1}, bytes={0})', vertexData.byteLength, offset);
        const gl = this._runtime.gl;
        this._runtime.bindArrayBuffer(this._vertexBuffer, this._id);
        gl.bufferSubData(ARRAY_BUFFER, offset, vertexData);
    }

    updateIndexData(indexData: BufferSource, offset: number = 0): void {
        this._logger.log('update_index_data(offset={1}, bytes={0})', indexData.byteLength, offset);
        const gl = this._runtime.gl;
        this._runtime.bindElementArrayBuffer(this._indexBuffer, this._id);
        gl.bufferSubData(ELEMENT_ARRAY_BUFFER, offset, indexData);
    }

    setIndexCount(indexCount: number): void {
        this._logger.log('set_index_count({0})', indexCount);
        this._indexCount = indexCount;
    }

    program(): Program {
        return this._program;
    }

    setProgram(program: Program): void {
        this._logger.log('set_program');
        if (this._program === program) {
            return;
        }
        this._program = program;
        this._runtime.bindVertexArrayObject(this._vao, this._id);
        this._runtime.bindArrayBuffer(this._vertexBuffer, this._id);
        this._program.setupVertexAttributes();
        this._runtime.bindElementArrayBuffer(this._indexBuffer, this._id);
        this._runtime.bindVertexArrayObject(null, this._id);
    }

    render(): void {
        const gl = this._runtime.gl;
        // TODO: Consider "return" here if program is "empty".
        this._program.use();
        this._runtime.bindVertexArrayObject(this._vao, this._id);
        gl.drawElements(TRIANGLES, this._indexCount, UNSIGNED_SHORT, 0);
        this._runtime.bindVertexArrayObject(null, this._id);
    }
}
