import { contextConstants } from './context-constants';
import { Program, EMPTY_PROGRAM, UniformValues } from './program';
import { Runtime } from './runtime';
import { Logger, raiseError, generateId } from './utils';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
    STATIC_DRAW, TRIANGLES, UNSIGNED_SHORT,
} = contextConstants;

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
            throw raiseError(this._logger, 'Failed to create vertex array object');
        }
        return vao;
    }

    private _createBuffer(): WebGLBuffer {
        const buffer = this._runtime.gl.createBuffer();
        if (!buffer) {
            throw raiseError(this._logger, 'Failed to create buffer.');
        }
        return buffer;
    }

    setData(vertexData: BufferSource, indexData: Uint16Array): void {
        this._logger.log('set_data', `vertex: ${vertexData.byteLength}`, `index: ${indexData.length * 2}`);
        const gl = this._runtime.gl;
        const vao = this._runtime.vaoExt;
        vao.bindVertexArrayOES(this._vao);
        gl.bindBuffer(ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(ARRAY_BUFFER, vertexData, STATIC_DRAW);
        gl.bufferData(ELEMENT_ARRAY_BUFFER, indexData, STATIC_DRAW);
        vao.bindVertexArrayOES(null);
        this._indexCount = indexData.length;
    }

    setProgram(program: Program): void {
        this._logger.log('set_program');
        this._program = program;
        const vao = this._runtime.vaoExt;
        vao.bindVertexArrayOES(this._vao);
        this._program.setupVertexAttributes();
        vao.bindVertexArrayOES(null);
    }

    draw(uniforms?: UniformValues): void {
        const gl = this._runtime.gl;
        const vao = this._runtime.vaoExt;
        gl.useProgram(this._program.program);
        if (uniforms) {
            this._program.setUniforms(uniforms);
        }
        vao.bindVertexArrayOES(this._vao);
        gl.drawElements(TRIANGLES, this._indexCount, UNSIGNED_SHORT, 0);
        vao.bindVertexArrayOES(null);
    }
}
