import type {
    SHADER_ATTRIBUTE_TYPE, SHADER_UNIFORM_TYPE, ShaderAttribute, ShaderUniform, SHADER_UNIFORM_VALUE,
    ProgramOptions, ProgramRuntime,
} from './program.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Logger } from '../common/logger.types';
import { BaseDisposable } from '../common/base-disposable';
import { isVec2 } from '../geometry/vec2';
import { isVec3 } from '../geometry/vec3';
import { isVec4 } from '../geometry/vec4';
import { isMat2 } from '../geometry/mat2';
import { isMat3 } from '../geometry/mat3';
import { isMat4 } from '../geometry/mat4';
import { isColor } from '../common/color';
import { formatStr } from '../utils/string-formatter';

const WebGL = WebGLRenderingContext.prototype;

const GL_VERTEX_SHADER = WebGL.VERTEX_SHADER;
const GL_FRAGMENT_SHADER = WebGL.FRAGMENT_SHADER;
const GL_LINK_STATUS = WebGL.LINK_STATUS;
const GL_ACTIVE_ATTRIBUTES = WebGL.ACTIVE_ATTRIBUTES;
const GL_ACTIVE_UNIFORMS = WebGL.ACTIVE_UNIFORMS;

type UniformSetter = (
    logger: Logger, gl: WebGLRenderingContext, attr: ShaderUniform, value: SHADER_UNIFORM_VALUE
) => void;

type UniformSettersMap = Readonly<Partial<Record<SHADER_UNIFORM_TYPE, UniformSetter>>>;

// TODO: Add ReadonlyRecord common type.
const ATTRIBUTE_TYPE_MAP: Readonly<Record<number, SHADER_ATTRIBUTE_TYPE>> = {
    [WebGL.FLOAT]: 'float',
    [WebGL.FLOAT_VEC2]: 'float2',
    [WebGL.FLOAT_VEC3]: 'float3',
    [WebGL.FLOAT_VEC4]: 'float4',
    [WebGL.INT]: 'int',
    [WebGL.INT_VEC2]: 'int2',
    [WebGL.INT_VEC3]: 'int3',
    [WebGL.INT_VEC4]: 'int4',
    [WebGL.BOOL]: 'bool',
    [WebGL.BOOL_VEC2]: 'bool2',
    [WebGL.BOOL_VEC3]: 'bool3',
    [WebGL.BOOL_VEC4]: 'bool4',
};

const UNIFORM_TYPE_MAP: Readonly<Record<number, SHADER_UNIFORM_TYPE>> = {
    ...ATTRIBUTE_TYPE_MAP,
    [WebGL.FLOAT_MAT2]: 'float2x2',
    [WebGL.FLOAT_MAT3]: 'float3x3',
    [WebGL.FLOAT_MAT4]: 'float4x4',
    [WebGL.SAMPLER_2D]: 'sampler2D',
    [WebGL.SAMPLER_CUBE]: 'samplerCube',
};

function isNumArray(arg: unknown, length: number): arg is number[] {
    return Array.isArray(arg) && arg.length >= length;
}

const UNIFORM_SETTERS_MAP: UniformSettersMap = {
    'bool': (logger, gl, { location }, value) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
            gl.uniform1i(location, Number(value));
        } else {
            throw logger.error(`bad value for "bool" uniform: ${value}`);
        }

    },
    'float': (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (isNumArray(value, 1)) {
            gl.uniform1fv(location, value);
        } else {
            throw logger.error(`bad value for "float" uniform: ${value}`);
        }
    },
    'float2': (logger, gl, { location }, value) => {
        if (isVec2(value)) {
            gl.uniform2f(location, value.x, value.y);
        } else if (isNumArray(value, 2)) {
            gl.uniform2fv(location, value);
        } else {
            throw logger.error(`bad value for "vec2" uniform: ${value}`);
        }
    },
    'float3': (logger, gl, { location }, value) => {
        if (isVec3(value)) {
            gl.uniform3f(location, value.x, value.y, value.z);
        } else if (isNumArray(value, 3)) {
            gl.uniform3fv(location, value);
        } else if (isColor(value)) {
            gl.uniform3f(location, value.r, value.g, value.b);
        } else {
            throw logger.error(`bad value for "vec3" uniform: ${value}`);
        }
    },
    'float4': (logger, gl, { location }, value) => {
        if (isVec4(value)) {
            gl.uniform4f(location, value.x, value.y, value.z, value.w);
        } else if (isNumArray(value, 4)) {
            gl.uniform4fv(location, value);
        } else if (isColor(value)) {
            gl.uniform4f(location, value.r, value.g, value.b, value.a);
        } else {
            throw logger.error(`bad value for "vec4" uniform: ${value}`);
        }
    },
    'sampler2D': (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw logger.error(`bad value for "sampler2D" uniform: ${value}`);
        }
    },
    'samplerCube': (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw logger.error(`bad value for "samplerCube" uniform: ${value}`);
        }
    },
    'float2x2': (logger, gl, { location }, value) => {
        if (isMat2(value)) {
            gl.uniformMatrix2fv(location, false, value as number[]);
        } else if (isNumArray(value, 4)) {
            gl.uniformMatrix2fv(location, false, value);
        } else {
            throw logger.error(`bad value for "mat2" uniform: ${value}`);
        }
    },
    'float3x3': (logger, gl, { location }, value) => {
        if (isMat3(value)) {
            gl.uniformMatrix3fv(location, false, value as number[]);
        } else if (isNumArray(value, 9)) {
            gl.uniformMatrix3fv(location, false, value);
        } else {
            throw logger.error(`bad value for "mat3" uniform: ${value}`);
        }
    },
    'float4x4': (logger, gl, { location }, value) => {
        if (isMat4(value)) {
            gl.uniformMatrix4fv(location, false, value as number[]);
        } else if (isNumArray(value, 16)) {
            gl.uniformMatrix4fv(location, false, value);
        } else {
            throw logger.error(`bad value for "mat4" uniform: ${value}`);
        }
    },
};

const UNIFORM_ARRAY_SETTERS_MAP: UniformSettersMap = {
    'bool': (logger, gl, { location, arraySize }, value) => {
        if (isNumArray(value, arraySize)) {
            gl.uniform1iv(location, value);
        } else {
            throw logger.error(`bad value for "bool[${arraySize}]" uniform: ${value}`);
        }

    },
    'float': (logger, gl, { location, arraySize }, value) => {
        if (isNumArray(value, arraySize)) {
            gl.uniform1fv(location, value);
        } else {
            throw logger.error(`bad value for "float[${arraySize}]" uniform: ${value}`);
        }
    },
};

export class Program extends BaseDisposable implements GLHandleWrapper<WebGLProgram> {
    private readonly _runtime: ProgramRuntime;
    private readonly _vertShader: WebGLShader;
    private readonly _fragShader: WebGLShader;
    private readonly _attributes: ShaderAttribute[];
    private readonly _uniforms: ShaderUniform[];
    private readonly _uniformsMap: Record<string, number>;
    private readonly _program: WebGLProgram;

    constructor(runtime: ProgramRuntime, options: ProgramOptions, tag?: string) {
        super(runtime.logger(), tag);
        this._logger.log('init');
        this._runtime = runtime;
        try {
            this._program = this._createProgram();
            const prefix = buildSourcePrefix(options.defines);
            this._vertShader = this._createShader(GL_VERTEX_SHADER, combineSource(options.vertShader, prefix));
            this._fragShader = this._createShader(GL_FRAGMENT_SHADER, combineSource(options.fragShader, prefix));
            if (options.locations) {
                this._bindAttributes(options.locations);
            }
            this._linkProgram();
            this._attributes = this._collectAttributes();
            this._uniforms = this._collectUniforms();
            this._uniformsMap = buildUniformsMap(this._uniforms);
        } catch (err) {
            // TODO: Use DisposableContext.
            this._disposeObjects();
            throw err;
        }
    }

    dispose(): void {
        this._logger.log('dispose');
        this._disposeObjects();
        this._emitDisposed();
    }

    glHandle(): WebGLProgram {
        return this._program;
    }

    attributes(): ReadonlyArray<ShaderAttribute> {
        return this._attributes;
    }

    uniforms(): ReadonlyArray<ShaderUniform> {
        return this._uniforms;
    }

    private _disposeObjects(): void {
        this._deleteShader(this._vertShader);
        this._deleteShader(this._fragShader);
        this._runtime.gl().deleteProgram(this._program);
    }

    private _createProgram(): WebGLProgram {
        const program = this._runtime.gl().createProgram();
        if (!program) {
            throw this._logger.error('failed to create program');
        }
        return program;
    }

    private _createShader(type: number, source: string): WebGLShader {
        const gl = this._runtime.gl();
        const shader = gl.createShader(type)!;
        if (!shader) {
            throw this._logger.error('failed to create shader');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(this._program, shader);
        return shader;
    }

    private _deleteShader(shader: WebGLShader): void {
        const gl = this._runtime.gl();
        if (shader) {
            gl.detachShader(this._program, shader);
            gl.deleteShader(shader);
        }
    }

    private _bindAttributes(locations: Readonly<Record<string, number>>): void {
        const gl = this._runtime.gl();
        for (const [name, location] of Object.entries(locations)) {
            gl.bindAttribLocation(this._program, location, name);
        }
    }

    private _linkProgram(): void {
        const gl = this._runtime.gl();
        gl.linkProgram(this._program);
        if (!gl.getProgramParameter(this._program, GL_LINK_STATUS)) {
            const linkInfo = gl.getProgramInfoLog(this._program)!;
            const vertexInfo = gl.getShaderInfoLog(this._vertShader);
            const fragmentInfo = gl.getShaderInfoLog(this._fragShader);
            let message = formatStr(linkInfo);
            if (vertexInfo) {
                message += '\n' + vertexInfo;
            }
            if (fragmentInfo) {
                message += '\n' + fragmentInfo;
            }
            throw this._logger.error(message);
        }
    }

    private _collectAttributes(): ShaderAttribute[] {
        const gl = this._runtime.gl();
        const program = this._program;
        const count = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES) as number;
        const attributes: ShaderAttribute[] = [];
        for (let i = 0; i < count; ++i) {
            const info = gl.getActiveAttrib(program, i)!;
            const { name } = info;
            if (info.size > 1) {
                throw this._logger.error(`attribute "${name}" size is not valid: ${info.size}`);
            }
            const dataType = ATTRIBUTE_TYPE_MAP[info.type];
            if (!dataType) {
                throw this._logger.error(`attribute "${name}" type is unknown: ${info.type}`);
            }
            const location = gl.getAttribLocation(program, name);
            attributes.push({
                name,
                type: dataType,
                location,
            });
        }
        return attributes;
    }

    private _collectUniforms(): ShaderUniform[] {
        const gl = this._runtime.gl();
        const program = this._program;
        const count = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS) as number;
        const uniforms: ShaderUniform[] = [];
        for (let i = 0; i < count; ++i) {
            const info = gl.getActiveUniform(program, i)!;
            const isArray = info.size > 1;
            // Uniform of array type have name like "something[0]". Postfix "[0]" is removed.
            const name = isArray ? info.name.substring(0, info.name.length - 3) : info.name;
            const location = gl.getUniformLocation(program, info.name)!;
            const dataType = UNIFORM_TYPE_MAP[info.type];
            if (!dataType) {
                throw this._logger.error(`uniform "${name}" type is unknown: ${info.type}`);
            }
            uniforms.push({
                name,
                type: dataType,
                location,
                arraySize: info.size,
            });
        }
        return uniforms;
    }

    setUniform(name: string, value: SHADER_UNIFORM_VALUE): void {
        this._logger.log(`set_uniform(${name}: ${value})`);
        const gl = this._runtime.gl();
        const uniform = this._uniforms[this._uniformsMap[name]];
        if (!uniform) {
            throw this._logger.error(`uniform "${name}" is unknown`);
        }
        const setter = (uniform.arraySize > 1 ? UNIFORM_ARRAY_SETTERS_MAP : UNIFORM_SETTERS_MAP)[uniform.type];
        if (!setter) {
            throw this._logger.error(`uniform "${name}" setter is not found`);
        }
        // Program must be set as CURRENT_PROGRAM before gl.uniformXXX is called.
        // Otherwise it would cause an error.
        // > INVALID_OPERATION: uniformXXX: location is not from current program
        this._runtime.useProgram(this);
        setter(this._logger, gl, uniform, value);
    }
}

function buildSourcePrefix(defines: Readonly<Record<string, string>> | undefined): string {
    const lines: string[] = [];
    if (defines) {
        for (const [key, val] of Object.entries(defines)) {
            lines.push(`#define ${key} ${val}`);
        }
    }
    return lines.join('\n');
}

function combineSource(source: string, prefix: string): string {
    if (!prefix) {
        return source;
    }
    return `${prefix}\n#line 1 0\n${source}`;
}

function buildUniformsMap(uniforms: ReadonlyArray<ShaderUniform>): Record<string, number> {
    const result: Record<string, number> = {};
    for (let i = 0; i < uniforms.length; ++i) {
        result[uniforms[i].name] = i;
    }
    return result;
}
