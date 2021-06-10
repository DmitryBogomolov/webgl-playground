import { Program, EMPTY_PROGRAM, UniformValues } from './program';
import { Runtime } from './runtime';
import { generateId } from './utils/id-generator';
import { Logger } from './utils/logger';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
    STATIC_DRAW, TRIANGLES, UNSIGNED_SHORT,
} = WebGLRenderingContext.prototype;

export class Primitive {
    private readonly _id = generateId('Primitve');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime;
    private readonly _vao: WebGLVertexArrayObjectOES;
    private readonly _vertexBuffer: WebGLBuffer;
    private readonly _indexBuffer: WebGLBuffer;
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

    setData(vertexData: BufferSource, indexData: Uint16Array): void {
        this._logger.log('set_data(vertex: {0}, index: {1})', vertexData.byteLength, indexData.length / 2);
        const gl = this._runtime.gl;
        gl.bindBuffer(ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(ARRAY_BUFFER, vertexData, STATIC_DRAW);
        gl.bindBuffer(ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(ELEMENT_ARRAY_BUFFER, indexData, STATIC_DRAW);
        this._indexCount = indexData.length;
    }

    setProgram(program: Program): void {
        this._logger.log('set_program');
        this._program = program;
        const gl = this._runtime.gl;
        const vao = this._runtime.vaoExt;
        vao.bindVertexArrayOES(this._vao);
        gl.bindBuffer(ARRAY_BUFFER, this._vertexBuffer);
        this._program.setupVertexAttributes();
        gl.bindBuffer(ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        vao.bindVertexArrayOES(null);
    }

    render(uniforms?: UniformValues): void {
        const gl = this._runtime.gl;
        const vao = this._runtime.vaoExt;
        // Consider "return" here if program is "empty".
        this._program.use();
        if (uniforms) {
            this._program.setUniforms(uniforms);
        }
        vao.bindVertexArrayOES(this._vao);
        gl.drawElements(TRIANGLES, this._indexCount, UNSIGNED_SHORT, 0);
        vao.bindVertexArrayOES(null);
    }
}
