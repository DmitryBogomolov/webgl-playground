import { ProgramBase_, EMPTY_PROGRAM, UniformValues } from './program_';
import { Runtime_ } from './runtime_';
import { Logger, raiseError, generateId } from './utils';

export class Primitive_ {
    private readonly _id = generateId('Primitve');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime_;
    private readonly _vao: WebGLVertexArrayObjectOES;
    private readonly _vertexBuffer: WebGLBuffer;
    private readonly _indexBuffer: WebGLBuffer;
    private _program: ProgramBase_ = EMPTY_PROGRAM;
    private _indexCount: number = 0;

    constructor(runtime: Runtime_) {
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
        this._runtime.vao.deleteVertexArrayOES(this._vao);
    }

    private _createVao(): WebGLVertexArrayObjectOES {
        const vao = this._runtime.vao.createVertexArrayOES();
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
        const vao = this._runtime.vao;
        vao.bindVertexArrayOES(this._vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
        vao.bindVertexArrayOES(null);
        this._indexCount = indexData.length;
    }

    setProgram(program: ProgramBase_): void {
        this._logger.log('set_program');
        this._program = program;
        const vao = this._runtime.vao;
        vao.bindVertexArrayOES(this._vao);
        this._program.setupVertexAttributes();
        vao.bindVertexArrayOES(null);
    }

    draw(uniforms?: UniformValues): void {
        const gl = this._runtime.gl;
        const vao = this._runtime.vao;
        gl.useProgram(this._program.program);
        if (uniforms) {
            this._program.setUniforms(uniforms);
        }
        vao.bindVertexArrayOES(this._vao);
        gl.drawElements(gl.TRIANGLES, this._indexCount, gl.UNSIGNED_SHORT, 0);
        vao.bindVertexArrayOES(null);
    }
}
