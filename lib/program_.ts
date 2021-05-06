import { VertexSchema } from './vertex-schema';
import { contextConstants } from './context-constants';
import { generateId, Logger, raiseError } from './utils';
import { Runtime_ } from './runtime_';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
    FLOAT, FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4,
    INT, INT_VEC2, INT_VEC3, INT_VEC4,
    BOOL, BOOL_VEC2, BOOL_VEC3, BOOL_VEC4,
    FLOAT_MAT2, FLOAT_MAT3, FLOAT_MAT4,
    SAMPLER_2D,
} = contextConstants;

type v2 = readonly [number, number];
type v3 = readonly [number, number, number];
type v4 = readonly [number, number, number, number];
export type UniformValue = number | v2 | v3 | v4;

interface ShaderAttribute {
    readonly info: WebGLActiveInfo;
    readonly location: number;
    readonly type: ShaderType;
    readonly size: number;
}

interface ShaderUniform {
    readonly info: WebGLActiveInfo;
    readonly location: WebGLUniformLocation;
    readonly type: ShaderType;
    readonly size: number;
}

type UniformSetter = (
    logger: Logger, gl: WebGLRenderingContext, attr: ShaderUniform, value: UniformValue
) => void;

type ShaderType = 'float' | 'int' | 'bool' | 'sampler';

interface ShaderTypesMap {
    readonly [key: number]: { type: ShaderType, size: number };
}

interface UniformSettersMap {
    readonly [key: number]: UniformSetter;
}

export interface UniformValues {
    readonly [name: string]: UniformValue;
}

const shaderTypes: ShaderTypesMap = {
    [FLOAT]: { type: 'float', size: 1 },
    [FLOAT_VEC2]: { type: 'float', size: 2 },
    [FLOAT_VEC3]: { type: 'float', size: 3 },
    [FLOAT_VEC4]: { type: 'float', size: 4 },
    [INT]: { type: 'int', size: 1 },
    [INT_VEC2]: { type: 'int', size: 2 },
    [INT_VEC3]: { type: 'int', size: 3 },
    [INT_VEC4]: { type: 'int', size: 4 },
    [BOOL]: { type: 'bool', size: 1 },
    [BOOL_VEC2]: { type: 'bool', size: 2 },
    [BOOL_VEC3]: { type: 'bool', size: 3 },
    [BOOL_VEC4]: { type: 'bool', size: 4 },
    [FLOAT_MAT2]: { type: 'float', size: 4 },
    [FLOAT_MAT3]: { type: 'float', size: 9 },
    [FLOAT_MAT4]: { type: 'float', size: 16 },
    [SAMPLER_2D]: { type: 'sampler', size: 1 },
};

const uniformSetters: UniformSettersMap = {
    [FLOAT]: (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else {
            throw raiseError(logger, `bad value for "float" uniform: "${value}"`);
        }
    },
    [FLOAT_VEC2]: (logger, gl, { location }, value) => {
        if (Array.isArray(value) && value.length === 2) {
            gl.uniform2fv(location, value);
        } else {
            throw raiseError(logger, `bad value for "vec2" uniform: "${value}"`);
        }
    },
    [FLOAT_VEC3]: (logger, gl, { location }, value) => {
        if (Array.isArray(value) && value.length === 3) {
            gl.uniform3fv(location, value);
        } else {
            throw raiseError(logger, `bad value for "vec3" uniform: "${value}"`);
        }
    },
    [FLOAT_VEC4]: (logger, gl, { location }, value) => {
        if (Array.isArray(value) && value.length === 4) {
            gl.uniform4fv(location, value);
        } else {
            throw raiseError(logger, `bad value for "vec4" uniform: "${value}"`);
        }
    },
    [SAMPLER_2D]: (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw raiseError(logger, `bad value for "sampler2D" uniform: "${value}"`);
        }
    },
};

interface AttributesMap {
    readonly [key: string]: ShaderAttribute;
}

interface UniformsMap {
    readonly [key: string]: ShaderUniform;
}

export interface ProgramOptions {
    readonly vertexShader: string;
    readonly fragmentShader: string;
    readonly schema: VertexSchema;
}

export class Program_ {
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
            throw raiseError(this._logger, 'failed to create program');
        }
        return program;
    }

    private _createShader(type: number, source: string): WebGLShader {
        const gl = this._runtime.gl;
        const shader = gl.createShader(type)!;
        if (!shader) {
            throw raiseError(this._logger, 'failed to create shader');
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
        const attributes: Record<string, ShaderAttribute> = {};
        for (let i = 0; i < count; ++i) {
            const info = gl.getActiveAttrib(this.program, i)!;
            const location = gl.getAttribLocation(this.program, info.name);
            attributes[info.name] = {
                info,
                location,
                ...shaderTypes[info.type],
            };
        }
        return attributes;
    }

    private _collectUniforms(): UniformsMap {
        const gl = this._runtime.gl;
        const program = this.program;
        const count = gl.getProgramParameter(program, ACTIVE_UNIFORMS) as number;
        const uniforms: Record<string, ShaderUniform> = {};
        for (let i = 0; i < count; ++i) {
            const info = gl.getActiveUniform(program, i)!;
            const location = gl.getUniformLocation(program, info.name)!;
            uniforms[info.name] = {
                info,
                location,
                ...shaderTypes[info.type],
            };
        }
        return uniforms;
    }

    setupVertexAttributes(): void {
        this._logger.log('setup_vertex_attributes');
        const gl = this._runtime.gl;
        const stride = this._schema.vertexSize;
        for (const attr of this._schema.attributes) {
            const shaderAttr = this._attributes[attr.name];
            if (!shaderAttr) {
                throw raiseError(this._logger, `attribute "${attr.name}" is unknown`);
            }
            // Is there a way to validate type?
            // There can be normalized ushort4 for vec4 color. So type equality cannot be required.
            if (attr.size !== shaderAttr.size) {
                throw raiseError(this._logger,
                    `attribute "${attr.name}" size is ${attr.size} but shader size is ${shaderAttr.size}`);
            }
            gl.vertexAttribPointer(shaderAttr.location, attr.size, attr.gltype, attr.normalized, stride, attr.offset);
            gl.enableVertexAttribArray(shaderAttr.location);
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
            const setter = uniformSetters[attr.info.type];
            if (!setter) {
                throw raiseError(this._logger, `uniform "${name}" setter is not found`);
            }
            setter(this._logger, gl, attr, value);
        }
    }
}

export const EMPTY_PROGRAM = {
    program: null,
    setupVertexAttributes() { /* empty */ },
    setUniforms() { /* empty */ },
} as unknown as Program_;
