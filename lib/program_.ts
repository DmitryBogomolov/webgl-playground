import { VertexSchema } from './vertex-schema';
import { contextConstants } from './context-constants';
import { generateId, Logger, raiseError } from './utils';
import { Runtime_ } from './runtime_';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
    FLOAT, FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4,
    SAMPLER_2D,
} = contextConstants;

type v2 = Readonly<[number, number]>;
type v3 = Readonly<[number, number, number]>;
type v4 = Readonly<[number, number, number, number]>;
// TODO: Support Color type.
export type UniformValue = number | v2 | v3 | v4;

type UniformSetter = (ctx: WebGLRenderingContext, location: WebGLUniformLocation, value: UniformValue) => void;

interface UniformSettersMap {
    readonly [key: number]: UniformSetter;
}

export interface UniformValues {
    readonly [name: string]: UniformValue;
}

// TODO: Add actual type verification here (like Number.isFinite, Array.isArray, etc...).
const uniformSetters: UniformSettersMap = {
    [FLOAT]: (ctx, location, value) => ctx.uniform1f(location, value as number),
    [FLOAT_VEC2]: (ctx, location, value) => ctx.uniform2fv(location, value as v2),
    [FLOAT_VEC3]: (ctx, location, value) => ctx.uniform3fv(location, value as v3),
    [FLOAT_VEC4]: (ctx, location, value) => ctx.uniform4fv(location, value as v4),
    [SAMPLER_2D]: (ctx, location, value) => ctx.uniform1i(location, value as number),
};

interface AttributeDesc {
    readonly location: number;
    readonly size: number;
    readonly type: number;
}

interface UniformDesc {
    readonly location: WebGLUniformLocation;
    readonly size: number;
    readonly type: number;
}

interface AttributesMap {
    readonly [key: string]: AttributeDesc;
}

interface UniformsMap {
    readonly [key: string]: UniformDesc;
}

export interface ProgramOptions {
    readonly vertexShader: string;
    readonly fragmentShader: string;
    readonly schema: VertexSchema;
}

export interface ProgramBase_ {
    readonly program: WebGLProgram | null;
    setupVertexAttributes(): void;
    setUniforms(uniforms: UniformValues): void;
}

export class Program_ implements ProgramBase_ {
    private readonly _id = generateId('Program');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime_;
    readonly program: WebGLProgram;
    private readonly _vertexShader: WebGLShader;
    private readonly _fragmentShader: WebGLShader;
    private readonly _schema: VertexSchema;
    private _attributes: AttributesMap = {};
    private _uniforms: UniformsMap = {};

    constructor(runtime: Runtime_, options: ProgramOptions) {
        this._logger.log('init');
        this._runtime = runtime;
        this.program = this._createProgram();
        this._vertexShader = this._createShader(VERTEX_SHADER, options.vertexShader);
        this._fragmentShader = this._createShader(FRAGMENT_SHADER, options.fragmentShader);
        this._linkProgram();
        this._attributes = this._collectAttributes();
        this._uniforms = this._collectUniforms();
        this._schema = options.schema;
    }

    dispose(): void {
        this._logger.log('dispose');
        this._deleteShader(this._vertexShader);
        this._deleteShader(this._fragmentShader);
        this._runtime.gl.deleteProgram(this.program);
    }

    private _createProgram(): WebGLProgram {
        const program = this._runtime.gl.createProgram();
        if (!program) {
            throw raiseError(this._logger, 'Failed to create program.');
        }
        return program;
    }

    private _createShader(type: number, source: string): WebGLShader {
        const gl = this._runtime.gl;
        const shader = gl.createShader(type)!;
        if (!shader) {
            throw raiseError(this._logger, 'Failed to create shader.');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader)!;
            gl.deleteShader(shader);
            throw raiseError(this._logger, info);
        }
        gl.attachShader(this.program, shader);
        return shader;
    }

    private _deleteShader(shader: WebGLShader): void {
        const gl = this._runtime.gl;
        gl.detachShader(this.program, shader);
        gl.deleteShader(shader);
    }

    private _linkProgram(): void {
        const gl = this._runtime.gl;
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, LINK_STATUS)) {
            const info = gl.getProgramInfoLog(this.program)!;
            throw raiseError(this._logger, info);
        }
    }

    private _collectAttributes(): AttributesMap {
        const gl = this._runtime.gl;
        const count = gl.getProgramParameter(this.program, ACTIVE_ATTRIBUTES) as number;
        const attributes: Record<string, AttributeDesc> = {};
        for (let i = 0; i < count; ++i) {
            const { name, size, type } = gl.getActiveAttrib(this.program, i)!;
            const location = gl.getAttribLocation(this.program, name);
            attributes[name] = {
                location,
                size,
                type,
            };
        }
        return attributes;
    }

    private _collectUniforms(): UniformsMap {
        const gl = this._runtime.gl;
        const program = this.program;
        const count = gl.getProgramParameter(program, ACTIVE_UNIFORMS) as number;
        const uniforms: Record<string, UniformDesc> = {};
        for (let i = 0; i < count; ++i) {
            const { name, size, type } = gl.getActiveUniform(program, i)!;
            const location = gl.getUniformLocation(program, name)!;
            uniforms[name] = {
                location,
                size,
                type,
            };
        }
        return uniforms;
    }

    setupVertexAttributes(): void {
        this._logger.log('setup_vertex_attributes');
        const gl = this._runtime.gl;
        const attributes = this._attributes;
        const stride = this._schema.vertexSize;
        for (const item of this._schema.items) {
            const attr = attributes[item.name];
            if (!attr) {
                throw raiseError(this._logger, `attribute "${item.name}" is unknown`);
            }
            // TODO: Validate type and size (if it is possible).
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
            gl.vertexAttribPointer(
                attr.location, item.size, item.gltype, item.normalized, stride, item.offset,
            );
            gl.enableVertexAttribArray(attr.location);
        }
    }

    setUniforms(uniforms: UniformValues): void {
        this._logger.log('set_uniforms', uniforms);
        const gl = this._runtime.gl;
        for (const [name, value] of Object.entries(uniforms)) {
            const attr = this._uniforms[name];
            if (!attr) {
                throw raiseError(this._logger, `uniform "${name}" is unknown`);
            }
            const setter = uniformSetters[attr.type];
            if (!setter) {
                throw raiseError(this._logger, `uniform "${name}" setter is not found`);
            }
            setter(gl, attr.location, value);
        }
    }
}

export const EMPTY_PROGRAM: ProgramBase_ = {
    program: null,
    setupVertexAttributes() { /* empty */ },
    setUniforms() { /* empty */ },
};
