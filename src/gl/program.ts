import type {
    ProgramParams, ProgramRuntime,
    SHADER_ATTRIBUTE_TYPE, SHADER_UNIFORM_TYPE, ShaderAttribute, ShaderUniform, SHADER_UNIFORM_VALUE,
} from './program.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { Mapping } from '../common/mapping.types';
import { BaseObject } from './base-object';
import { isVec2 } from '../geometry/vec2';
import { isVec3 } from '../geometry/vec3';
import { isVec4 } from '../geometry/vec4';
import { isMat2 } from '../geometry/mat2';
import { isMat3 } from '../geometry/mat3';
import { isMat4 } from '../geometry/mat4';
import { isColor } from '../common/color';
import { toStr } from '../utils/string-formatter';
import { DisposableContext } from '../utils/disposable-context';

const WebGL = WebGLRenderingContext.prototype;

const GL_VERTEX_SHADER = WebGL.VERTEX_SHADER;
const GL_FRAGMENT_SHADER = WebGL.FRAGMENT_SHADER;
const GL_LINK_STATUS = WebGL.LINK_STATUS;
const GL_ACTIVE_ATTRIBUTES = WebGL.ACTIVE_ATTRIBUTES;
const GL_ACTIVE_UNIFORMS = WebGL.ACTIVE_UNIFORMS;

const ATTRIBUTE_TYPE_MAP: Mapping<number, SHADER_ATTRIBUTE_TYPE> = {
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

const UNIFORM_TYPE_MAP: Mapping<number, SHADER_UNIFORM_TYPE> = {
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

type UniformSetter = (gl: WebGLRenderingContext, attr: ShaderUniform, value: SHADER_UNIFORM_VALUE) => void;
type UniformSettersMap = Partial<Mapping<SHADER_UNIFORM_TYPE, UniformSetter>>;

const UNIFORM_SETTERS_MAP: UniformSettersMap = {
    'bool': (gl, { location }, value) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
            gl.uniform1i(location, Number(value));
        } else {
            throw new Error(`bad value for "bool" uniform: ${toStr(value)}`);
        }

    },
    'float': (gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (isNumArray(value, 1)) {
            gl.uniform1f(location, value[0]);
        } else {
            throw new Error(`bad value for "float" uniform: ${toStr(value)}`);
        }
    },
    'float2': (gl, { location }, value) => {
        if (isVec2(value)) {
            gl.uniform2f(location, value.x, value.y);
        } else if (isNumArray(value, 2)) {
            gl.uniform2f(location, value[0], value[1]);
        } else {
            throw new Error(`bad value for "vec2" uniform: ${toStr(value)}`);
        }
    },
    'float3': (gl, { location }, value) => {
        if (isVec3(value)) {
            gl.uniform3f(location, value.x, value.y, value.z);
        } else if (isNumArray(value, 3)) {
            gl.uniform3f(location, value[0], value[1], value[2]);
        } else if (isColor(value)) {
            gl.uniform3f(location, value.r, value.g, value.b);
        } else {
            throw new Error(`bad value for "vec3" uniform: ${toStr(value)}`);
        }
    },
    'float4': (gl, { location }, value) => {
        if (isVec4(value)) {
            gl.uniform4f(location, value.x, value.y, value.z, value.w);
        } else if (isNumArray(value, 4)) {
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
        } else if (isColor(value)) {
            gl.uniform4f(location, value.r, value.g, value.b, value.a);
        } else {
            throw new Error(`bad value for "vec4" uniform: ${toStr(value)}`);
        }
    },
    'sampler2D': (gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw new Error(`bad value for "sampler2D" uniform: ${toStr(value)}`);
        }
    },
    'samplerCube': (gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw new Error(`bad value for "samplerCube" uniform: ${toStr(value)}`);
        }
    },
    'float2x2': (gl, { location }, value) => {
        if (isMat2(value)) {
            gl.uniformMatrix2fv(location, false, value as number[]);
        } else if (isNumArray(value, 4)) {
            gl.uniformMatrix2fv(location, false, value);
        } else {
            throw new Error(`bad value for "mat2" uniform: ${toStr(value)}`);
        }
    },
    'float3x3': (gl, { location }, value) => {
        if (isMat3(value)) {
            gl.uniformMatrix3fv(location, false, value as number[]);
        } else if (isNumArray(value, 9)) {
            gl.uniformMatrix3fv(location, false, value);
        } else {
            throw new Error(`bad value for "mat3" uniform: ${toStr(value)}`);
        }
    },
    'float4x4': (gl, { location }, value) => {
        if (isMat4(value)) {
            gl.uniformMatrix4fv(location, false, value as number[]);
        } else if (isNumArray(value, 16)) {
            gl.uniformMatrix4fv(location, false, value);
        } else {
            throw new Error(`bad value for "mat4" uniform: ${toStr(value)}`);
        }
    },
};

const UNIFORM_ARRAY_SETTERS_MAP: UniformSettersMap = {
    'bool': (gl, { location, arraySize }, value) => {
        if (isNumArray(value, arraySize)) {
            gl.uniform1iv(location, value);
        } else {
            throw new Error(`bad value for "bool[${arraySize}]" uniform: ${toStr(value)}`);
        }

    },
    'float': (gl, { location, arraySize }, value) => {
        if (isNumArray(value, arraySize)) {
            gl.uniform1fv(location, value);
        } else {
            throw new Error(`bad value for "float[${arraySize}]" uniform: ${toStr(value)}`);
        }
    },
};

export class Program extends BaseObject implements GLHandleWrapper<WebGLProgram> {
    private readonly _runtime: ProgramRuntime;
    private readonly _vertShader: WebGLShader;
    private readonly _fragShader: WebGLShader;
    private readonly _attributes: ShaderAttribute[];
    private readonly _uniforms: ShaderUniform[];
    private readonly _uniformsMap: Record<string, number>;
    private readonly _program: WebGLProgram;

    constructor(params: ProgramParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._logInfo('init');
        this._runtime = params.runtime;
        const gl = this._runtime.gl();
        const ctx = new DisposableContext();
        try {
            this._program = createProgram(gl, ctx);
            const prefix = buildSourcePrefix(params.defines);
            this._vertShader = createShader(gl, GL_VERTEX_SHADER, combineSource(params.vertShader, prefix), ctx);
            this._fragShader = createShader(gl, GL_FRAGMENT_SHADER, combineSource(params.fragShader, prefix), ctx);
            if (params.locations) {
                bindAttributes(gl, this._program, params.locations);
            }
            linkProgram(gl, this._program, this._vertShader, this._fragShader);
            this._attributes = collectAttributes(gl, this._program);
            this._uniforms = collectUniforms(gl, this._program);
            this._uniformsMap = buildUniformsMap(this._uniforms);
            ctx.release();
        } catch (err) {
            throw this._logError(err as Error);
        } finally {
            ctx.dispose();
        }
    }

    dispose(): void {
        this._logInfo('dispose');
        const gl = this._runtime.gl();
        gl.deleteShader(this._vertShader);
        gl.deleteShader(this._fragShader);
        gl.deleteProgram(this._program);
        this._dispose();
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

    setUniform(name: string, value: SHADER_UNIFORM_VALUE): void {
        this._logInfo(`set_uniform(${name}: ${toStr(value)})`);
        const gl = this._runtime.gl();
        const uniform = this._uniforms[this._uniformsMap[name]];
        if (!uniform) {
            throw this._logError(`uniform "${name}" is unknown`);
        }
        const setter = (uniform.arraySize > 1 ? UNIFORM_ARRAY_SETTERS_MAP : UNIFORM_SETTERS_MAP)[uniform.type];
        if (!setter) {
            throw this._logError(`uniform "${name}" setter is not found`);
        }
        // Program must be set as CURRENT_PROGRAM before gl.uniformXXX is called.
        // Otherwise it would cause an error.
        // > INVALID_OPERATION: uniformXXX: location is not from current program
        this._runtime.useProgram(this);
        try {
            setter(gl, uniform, value);
        } catch (err) {
            throw this._logError(err as Error);
        }
    }
}

function createProgram(gl: WebGLRenderingContext, ctx: DisposableContext): WebGLProgram {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('failed to create program');
    }
    function dispose(): void {
        gl.deleteProgram(program);
    }
    ctx.add({ dispose });
    return program;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string, ctx: DisposableContext): WebGLShader {
    const shader = gl.createShader(type)!;
    if (!shader) {
        throw new Error('failed to create shader');
    }
    function dispose(): void {
        gl.deleteShader(shader);
    }
    ctx.add({ dispose });
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function buildSourcePrefix(defines: Mapping<string, string> | undefined): string {
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

function bindAttributes(gl: WebGLRenderingContext, program: WebGLProgram, locations: Mapping<string, number>): void {
    for (const [name, location] of Object.entries(locations)) {
        gl.bindAttribLocation(program, location, name);
    }
}

function linkProgram(
    gl: WebGLRenderingContext, program: WebGLProgram, vertShader: WebGLShader, fragShader: WebGLShader,
): void {
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, GL_LINK_STATUS)) {
        const linkInfo = gl.getProgramInfoLog(program)!;
        const vertexInfo = gl.getShaderInfoLog(vertShader);
        const fragmentInfo = gl.getShaderInfoLog(fragShader);
        let message = linkInfo;
        if (vertexInfo) {
            message += '\n' + vertexInfo;
        }
        if (fragmentInfo) {
            message += '\n' + fragmentInfo;
        }
        throw new Error(message);
    }
}

function collectUniforms(gl: WebGLRenderingContext, program: WebGLProgram): ShaderUniform[] {
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
            throw new Error(`uniform "${name}" type is unknown: ${info.type}`);
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

function collectAttributes(gl: WebGLRenderingContext, program: WebGLProgram): ShaderAttribute[] {
    const count = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES) as number;
    const attributes: ShaderAttribute[] = [];
    for (let i = 0; i < count; ++i) {
        const info = gl.getActiveAttrib(program, i)!;
        const { name } = info;
        if (info.size > 1) {
            throw new Error(`attribute "${name}" size is not valid: ${info.size}`);
        }
        const dataType = ATTRIBUTE_TYPE_MAP[info.type];
        if (!dataType) {
            throw new Error(`attribute "${name}" type is unknown: ${info.type}`);
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

function buildUniformsMap(uniforms: ReadonlyArray<ShaderUniform>): Record<string, number> {
    const result: Record<string, number> = {};
    for (let i = 0; i < uniforms.length; ++i) {
        result[uniforms[i].name] = i;
    }
    return result;
}
