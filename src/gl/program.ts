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

const WebGL = WebGL2RenderingContext.prototype;

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

type UniformSetter = (gl: WebGL2RenderingContext, attr: ShaderUniform, value: SHADER_UNIFORM_VALUE) => void;
type UniformSettersMap = Partial<Mapping<SHADER_UNIFORM_TYPE, UniformSetter>>;

function raiseError(name: string, value: unknown): Error {
    throw new Error(`bad value for "${name}" uniform: ${toStr(value)}`);
}

const UNIFORM_SETTERS_MAP: UniformSettersMap = {
    'bool': (gl, { location }, value) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
            gl.uniform1i(location, Number(value));
        } else {
            raiseError('bool', value);
        }

    },
    'float': (gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (isNumArray(value, 1)) {
            gl.uniform1f(location, value[0]);
        } else {
            raiseError('float', value);
        }
    },
    'float2': (gl, { location }, value) => {
        if (isVec2(value)) {
            gl.uniform2f(location, value.x, value.y);
        } else if (isNumArray(value, 2)) {
            gl.uniform2f(location, value[0], value[1]);
        } else {
            raiseError('vec2', value);
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
            raiseError('vec3', value);
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
            raiseError('vec4', value);
        }
    },
    'sampler2D': (gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            raiseError('sampler2D', value);
        }
    },
    'samplerCube': (gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            raiseError('samplerCube', value);
        }
    },
    'float2x2': (gl, { location }, value) => {
        if (isMat2(value)) {
            gl.uniformMatrix2fv(location, false, value);
        } else if (isNumArray(value, 4)) {
            gl.uniformMatrix2fv(location, false, value);
        } else {
            raiseError('mat2', value);
        }
    },
    'float3x3': (gl, { location }, value) => {
        if (isMat3(value)) {
            gl.uniformMatrix3fv(location, false, value);
        } else if (isNumArray(value, 9)) {
            gl.uniformMatrix3fv(location, false, value);
        } else {
            raiseError('mat3', value);
        }
    },
    'float4x4': (gl, { location }, value) => {
        if (isMat4(value)) {
            gl.uniformMatrix4fv(location, false, value);
        } else if (isNumArray(value, 16)) {
            gl.uniformMatrix4fv(location, false, value);
        } else {
            raiseError('mat4', value);
        }
    },
};

const UNIFORM_ARRAY_SETTERS_MAP: UniformSettersMap = {
    'bool': (gl, { location, arraySize }, value) => {
        if (isNumArray(value, arraySize)) {
            gl.uniform1iv(location, value);
        } else {
            raiseError(`bool[${arraySize}]`, value);
        }

    },
    'float': (gl, { location, arraySize }, value) => {
        if (isNumArray(value, arraySize)) {
            gl.uniform1fv(location, value);
        } else {
            raiseError(`float[${arraySize}]`, value);
        }
    },
};

export class Program extends BaseObject implements GLHandleWrapper<WebGLProgram> {
    private readonly _runtime: ProgramRuntime;
    private readonly _attributes: ShaderAttribute[];
    private readonly _uniforms: ShaderUniform[];
    private readonly _uniformsMap: Record<string, number>;
    private readonly _program: WebGLProgram;

    constructor(params: ProgramParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._logInfo_('init');
        this._runtime = params.runtime;
        const defines = buildDefines(params.defines);
        const vertSource = prepareSource(params.vertShader, defines);
        const fragSource = prepareSource(params.fragShader, defines);
        let info!: ReturnType<typeof setupProgram>;
        try {
            info = setupProgram(
                this._runtime.gl(),
                vertSource,
                fragSource,
                params.locations,
            );
        } catch (err) {
            this._logError_(err as Error);
        }
        this._program = info.program;
        this._attributes = info.attributes;
        this._uniforms = info.uniforms;
        this._uniformsMap = buildUniformsMap(this._uniforms);
    }

    dispose(): void {
        this._logInfo_('dispose');
        this._runtime.gl().deleteProgram(this._program);
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
        this._logInfo_('set_uniform({0}, {1})', name, value);
        const gl = this._runtime.gl();
        const uniform = this._uniforms[this._uniformsMap[name]];
        if (!uniform) {
            throw this._logError_(`uniform "${name}" is unknown`);
        }
        const setter = (uniform.arraySize > 1 ? UNIFORM_ARRAY_SETTERS_MAP : UNIFORM_SETTERS_MAP)[uniform.type];
        if (!setter) {
            throw this._logError_(`uniform "${name}" setter is not found`);
        }
        // Program must be set as CURRENT_PROGRAM before gl.uniformXXX is called.
        // Otherwise it would cause an error.
        // > INVALID_OPERATION: uniformXXX: location is not from current program
        this._runtime.useProgram(this);
        try {
            setter(gl, uniform, value);
        } catch (err) {
            throw this._logError_(err as Error);
        }
    }
}

function setupProgram(
    gl: WebGL2RenderingContext,
    vertSource: string,
    fragSource: string,
    locations: Mapping<string, number> | undefined,
): {
    program: WebGLProgram;
    attributes: ShaderAttribute[];
    uniforms: ShaderUniform[];
} {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('failed to create program');
    }
    const vertShader = createShader(gl, GL_VERTEX_SHADER, vertSource);
    const fragShader = createShader(gl, GL_FRAGMENT_SHADER, fragSource);
    if (locations) {
        bindAttributes(gl, program, locations);
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    let attributes: ShaderAttribute[];
    let uniforms: ShaderUniform[];
    try {
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
            gl.deleteProgram(program);
            throw new Error(message);
        }
        attributes = collectAttributes(gl, program);
        uniforms = collectUniforms(gl, program);
        return { program, attributes, uniforms };
    } catch (err) {
        gl.deleteProgram(program);
        throw err;
    }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    if (!shader) {
        throw new Error('failed to create shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function buildDefines(defines: Mapping<string, string> | undefined): string {
    const lines: string[] = [];
    if (defines) {
        for (const [key, val] of Object.entries(defines)) {
            lines.push(`#define ${key} ${val}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}

function prepareSource(source: string, defines: string): string {
    if (!source) {
        throw new Error('bad shader source: null');
    }
    if (!defines) {
        return source;
    }
    const versionIdx = source.indexOf('#version ');
    if (versionIdx < 0) {
        return `${defines}#line 1\n${source}`;
    }
    const insertIdx = source.indexOf('\n', versionIdx) + 1;
    const header = source.substring(0, insertIdx);
    const lineNum = Array.from(header).reduce((count, ch) => ch === '\n' ? count + 1 : count, 0) + 1;
    return [
        header,
        defines,
        `#line ${lineNum}\n`,
        source.substring(insertIdx),
    ].join('');
}

function bindAttributes(gl: WebGL2RenderingContext, program: WebGLProgram, locations: Mapping<string, number>): void {
    for (const [name, location] of Object.entries(locations)) {
        gl.bindAttribLocation(program, location, name);
    }
}

function collectUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): ShaderUniform[] {
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

function collectAttributes(gl: WebGL2RenderingContext, program: WebGLProgram): ShaderAttribute[] {
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
