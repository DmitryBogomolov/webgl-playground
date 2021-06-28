import { VertexSchema } from './vertex-schema';
import { generateId } from './utils/id-generator';
import { Logger } from './utils/logger';
import { Runtime } from './runtime';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
    FLOAT, FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4,
    INT, INT_VEC2, INT_VEC3, INT_VEC4,
    BOOL, BOOL_VEC2, BOOL_VEC3, BOOL_VEC4,
    FLOAT_MAT2, FLOAT_MAT3, FLOAT_MAT4,
    SAMPLER_2D,
} = WebGLRenderingContext.prototype;

type v2 = readonly [number, number];
type v3 = readonly [number, number, number];
type v4 = readonly [number, number, number, number];
export type UniformValue = boolean | number | v2 | v3 | v4;

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

function isNumArray(arg: unknown, length: number): arg is number[] {
    return Array.isArray(arg) && arg.length >= length;
}

const uniformSetters: UniformSettersMap = {
    [BOOL]: (logger, gl, { location }, value) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
            gl.uniform1i(location, Number(value));
        } else {
            throw logger.error('bad value for "bool" uniform: {0}', value);
        }

    },
    [FLOAT]: (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else {
            throw logger.error('bad value for "float" uniform: {0}', value);
        }
    },
    [FLOAT_VEC2]: (logger, gl, { location }, value) => {
        if (isNumArray(value, 2)) {
            gl.uniform2fv(location, value);
        } else {
            throw logger.error('bad value for "vec2" uniform: {0}', value);
        }
    },
    [FLOAT_VEC3]: (logger, gl, { location }, value) => {
        if (isNumArray(value, 3)) {
            gl.uniform3fv(location, value);
        } else {
            throw logger.error('bad value for "vec3" uniform: {0}', value);
        }
    },
    [FLOAT_VEC4]: (logger, gl, { location }, value) => {
        if (isNumArray(value, 4)) {
            gl.uniform4fv(location, value);
        } else {
            throw logger.error('bad value for "vec4" uniform: {0}', value);
        }
    },
    [SAMPLER_2D]: (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw logger.error('bad value for "sampler2D" uniform: {0}', value);
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

export class Program {
    private readonly _id = generateId('Program');
    private readonly _logger = new Logger(this._id);
    private readonly _runtime: Runtime;
    private readonly _vertexShader: WebGLShader;
    private readonly _fragmentShader: WebGLShader;
    private readonly _schema: VertexSchema;
    private readonly _attributes: AttributesMap = {};
    private readonly _uniforms: UniformsMap = {};
    private readonly _program: WebGLProgram;

    constructor(runtime: Runtime, options: ProgramOptions) {
        this._logger.log('init');
        this._runtime = runtime;
        this._program = this._createProgram();
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
        this._runtime.gl.deleteProgram(this._program);
    }

    private _createProgram(): WebGLProgram {
        const program = this._runtime.gl.createProgram();
        if (!program) {
            throw this._logger.error('failed to create program');
        }
        return program;
    }

    private _createShader(type: number, source: string): WebGLShader {
        const gl = this._runtime.gl;
        const shader = gl.createShader(type)!;
        if (!shader) {
            throw this._logger.error('failed to create shader');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader)!;
            gl.deleteShader(shader);
            throw this._logger.error(info);
        }
        gl.attachShader(this._program, shader);
        return shader;
    }

    private _deleteShader(shader: WebGLShader): void {
        const gl = this._runtime.gl;
        gl.detachShader(this._program, shader);
        gl.deleteShader(shader);
    }

    private _linkProgram(): void {
        const gl = this._runtime.gl;
        gl.linkProgram(this._program);
        if (!gl.getProgramParameter(this._program, LINK_STATUS)) {
            const info = gl.getProgramInfoLog(this._program)!;
            throw this._logger.error(info);
        }
    }

    private _collectAttributes(): AttributesMap {
        const gl = this._runtime.gl;
        const count = gl.getProgramParameter(this._program, ACTIVE_ATTRIBUTES) as number;
        const attributes: Record<string, ShaderAttribute> = {};
        for (let i = 0; i < count; ++i) {
            const info = gl.getActiveAttrib(this._program, i)!;
            const location = gl.getAttribLocation(this._program, info.name);
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
        const program = this._program;
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

    use(): void {
        this._logger.log('use_program');
        const gl = this._runtime.gl;
        gl.useProgram(this._program);
    }

    setupVertexAttributes(): void {
        this._logger.log('setup_vertex_attributes');
        const gl = this._runtime.gl;
        for (const attr of this._schema.attributes) {
            const shaderAttr = this._attributes[attr.name];
            if (!shaderAttr) {
                throw this._logger.error('attribute "{0}" is unknown', attr.name);
            }
            // Is there a way to validate type?
            // There can be normalized ushort4 for vec4 color. So type equality cannot be required.
            if (attr.size !== shaderAttr.size) {
                throw this._logger.error(
                    'attribute "{0}" size is {1} but shader size is {2}', attr.name, attr.size, shaderAttr.size,
                );
            }
            gl.vertexAttribPointer(
                shaderAttr.location, attr.size, attr.gltype, attr.normalized, attr.stride, attr.offset,
            );
            gl.enableVertexAttribArray(shaderAttr.location);
        }
    }

    setUniform(name: string, value: UniformValue): void {
        this._logger.log('set_uniform({0}: {1})', name, value);
        const gl = this._runtime.gl;
        const attr = this._uniforms[name];
        if (!attr) {
            throw this._logger.error('uniform "{0}" is unknown', name);
        }
        const setter = uniformSetters[attr.info.type];
        if (!setter) {
            throw this._logger.error('uniform "{0}" setter is not found', name);
        }
        // TODO: Temporary solution.
        // > WebGL: INVALID_OPERATION: uniform4fv: location is not from current program
        gl.useProgram(this._program);
        setter(this._logger, gl, attr, value);
    }
}

export const EMPTY_PROGRAM = {
    program: null,
    use() { /* empty */ },
    setupVertexAttributes() { /* empty */ },
    setUniforms() { /* empty */ },
} as unknown as Program;
