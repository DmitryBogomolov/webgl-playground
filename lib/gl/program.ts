import { VertexSchema } from './vertex-schema';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { Runtime } from './runtime';
import { Vec2, isVec2 } from '../geometry/vec2';
import { Vec3, isVec3 } from '../geometry/vec3';
import { Vec4, isVec4 } from '../geometry/vec4';
import { Mat2, isMat2 } from '../geometry/mat2';
import { Mat3, isMat3 } from '../geometry/mat3';
import { Mat4, isMat4 } from '../geometry/mat4';
import { Color, isColor } from './color';
import { formatStr } from '../utils/string-formatter';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
    FLOAT, FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4,
    INT, INT_VEC2, INT_VEC3, INT_VEC4,
    BOOL, BOOL_VEC2, BOOL_VEC3, BOOL_VEC4,
    FLOAT_MAT2, FLOAT_MAT3, FLOAT_MAT4,
    SAMPLER_2D,
} = WebGLRenderingContext.prototype;

type v1 = readonly [number];
type v2 = readonly [number, number];
type v3 = readonly [number, number, number];
type v4 = readonly [number, number, number, number];
type arr = readonly number[];
export type UniformValue = boolean | number | v1 | v2 | v3 | v4 | arr | Vec2 | Vec3 | Vec4 | Mat2 | Mat3 | Mat4 | Color;

interface ShaderAttribute {
    readonly info: WebGLActiveInfo;
    readonly location: number;
    readonly type: ShaderType;
    readonly size: number;
}

interface ShaderUniform {
    readonly info: WebGLActiveInfo;
    readonly location: WebGLUniformLocation;
    readonly isArray: boolean;
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
        } else if (isNumArray(value, 1)) {
            gl.uniform1fv(location, value);
        } else {
            throw logger.error('bad value for "float" uniform: {0}', value);
        }
    },
    [FLOAT_VEC2]: (logger, gl, { location }, value) => {
        if (isVec2(value)) {
            gl.uniform2f(location, value.x, value.y);
        } else if (isNumArray(value, 2)) {
            gl.uniform2fv(location, value);
        } else {
            throw logger.error('bad value for "vec2" uniform: {0}', value);
        }
    },
    [FLOAT_VEC3]: (logger, gl, { location }, value) => {
        if (isVec3(value)) {
            gl.uniform3f(location, value.x, value.y, value.z);
        } else if (isNumArray(value, 3)) {
            gl.uniform3fv(location, value);
        } else if (isColor(value)) {
            gl.uniform3f(location, value.r, value.g, value.b);
        } else {
            throw logger.error('bad value for "vec3" uniform: {0}', value);
        }
    },
    [FLOAT_VEC4]: (logger, gl, { location }, value) => {
        if (isVec4(value)) {
            gl.uniform4f(location, value.x, value.y, value.z, value.w);
        } else if (isNumArray(value, 4)) {
            gl.uniform4fv(location, value);
        } else if (isColor(value)) {
            gl.uniform4f(location, value.r, value.g, value.b, value.a);
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
    [FLOAT_MAT2]: (logger, gl, { location }, value) => {
        if (isMat2(value)) {
            gl.uniformMatrix2fv(location, false, value as number[]);
        } else if (isNumArray(value, 4)) {
            gl.uniformMatrix2fv(location, false, value);
        } else {
            throw logger.error('bad value for "mat2" uniform: {0}', value);
        }
    },
    [FLOAT_MAT3]: (logger, gl, { location }, value) => {
        if (isMat3(value)) {
            gl.uniformMatrix3fv(location, false, value as number[]);
        } else if (isNumArray(value, 9)) {
            gl.uniformMatrix3fv(location, false, value);
        } else {
            throw logger.error('bad value for "mat3" uniform: {0}', value);
        }
    },
    [FLOAT_MAT4]: (logger, gl, { location }, value) => {
        if (isMat4(value)) {
            gl.uniformMatrix4fv(location, false, value as number[]);
        } else if (isNumArray(value, 16)) {
            gl.uniformMatrix4fv(location, false, value);
        } else {
            throw logger.error('bad value for "mat4" uniform: {0}', value);
        }
    },
};

const uniformArraySetters: UniformSettersMap = {
    [BOOL]: (logger, gl, { location, info }, value) => {
        if (isNumArray(value, info.size)) {
            gl.uniform1iv(location, value);
        } else {
            throw logger.error('bad value for "bool[{1}]" uniform: {0}', value, info.size);
        }

    },
    [FLOAT]: (logger, gl, { location, info }, value) => {
        if (isNumArray(value, info.size)) {
            gl.uniform1fv(location, value);
        } else {
            throw logger.error('bad value for "float[{1}]" uniform: {0}', value, info.size);
        }
    },
};

interface AttributesMap {
    readonly [key: string]: ShaderAttribute;
}

interface UniformsMap {
    readonly [key: string]: ShaderUniform;
}

interface UniformsCache {
    [name: string]: UniformValue;
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
    // private readonly _attributes: AttributesMap = {};
    private readonly _uniforms: UniformsMap = {};
    private readonly _cache: UniformsCache = {};
    private readonly _program: WebGLProgram;

    constructor(runtime: Runtime, options: ProgramOptions) {
        this._logger.log('init');
        this._runtime = runtime;
        this._schema = options.schema;
        this._program = this._createProgram();
        this._vertexShader = this._createShader(VERTEX_SHADER, options.vertexShader);
        this._fragmentShader = this._createShader(FRAGMENT_SHADER, options.fragmentShader);
        this._bindAttributes();
        this._linkProgram();
        /* this._attributes = */this._collectAttributes();
        this._uniforms = this._collectUniforms();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._dispose();
    }

    private _dispose(): void {
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
        gl.attachShader(this._program, shader);
        return shader;
    }

    private _deleteShader(shader: WebGLShader): void {
        const gl = this._runtime.gl;
        gl.detachShader(this._program, shader);
        gl.deleteShader(shader);
    }

    private _bindAttributes(): void {
        const gl = this._runtime.gl;
        for (const attr of this._schema.attributes) {
            gl.bindAttribLocation(this._program, attr.location, attr.name);
        }
    }

    private _linkProgram(): void {
        const gl = this._runtime.gl;
        gl.linkProgram(this._program);
        if (!gl.getProgramParameter(this._program, LINK_STATUS)) {
            const linkInfo = gl.getProgramInfoLog(this._program)!;
            const vertexInfo = gl.getShaderInfoLog(this._vertexShader);
            const fragmentInfo = gl.getShaderInfoLog(this._fragmentShader);
            let message = formatStr(linkInfo);
            if (vertexInfo) {
                message += '\n' + vertexInfo;
            }
            if (fragmentInfo) {
                message += '\n' + fragmentInfo;
            }
            this._dispose();
            throw this._logger.error(message);
        }
    }

    private _collectAttributes(): AttributesMap {
        const gl = this._runtime.gl;
        const program = this._program;
        const count = gl.getProgramParameter(program, ACTIVE_ATTRIBUTES) as number;
        const attributes: Record<string, ShaderAttribute> = {};
        for (let i = 0; i < count; ++i) {
            const info = gl.getActiveAttrib(program, i)!;
            const location = gl.getAttribLocation(program, info.name);
            attributes[info.name] = {
                info,
                location,
                ...shaderTypes[info.type],
            };
        }
        for (const attr of this._schema.attributes) {
            const shaderAttr = attributes[attr.name];
            if (!shaderAttr) {
                throw this._logger.error('attribute "{0}" is unknown', attr.name);
            }
            if (attr.location !== shaderAttr.location) {
                throw this._logger.error(
                    'attribute "{0}" location {1} does not match {2}', attr.name, attr.location, shaderAttr.location,
                );
            }
            // Is there a way to validate type?
            // There can be normalized ushort4 for vec4 color. So type equality cannot be required.
            // TODO: Consider allowing cases when attr.size < shaderAttr.size (shader provides default values).
            if (attr.size !== shaderAttr.size) {
                throw this._logger.error(
                    'attribute "{0}" size is {1} but shader size is {2}', attr.name, attr.size, shaderAttr.size,
                );
            }
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
            const isArray = info.size > 1;
            // Uniform of array type have name like "something[0]". Postfix "[0]" is removed.
            const name = isArray ? info.name.substring(0, info.name.length - 3) : info.name;
            const location = gl.getUniformLocation(program, info.name)!;
            uniforms[name] = {
                info,
                location,
                isArray,
            };
        }
        return uniforms;
    }

    schema(): VertexSchema {
        return this._schema;
    }

    use(): void {
        this._runtime.useProgram(this._program, this._id);
    }

    setUniform(name: string, value: UniformValue, force: boolean = false): void {
        // TODO: Is caching actually required at all?
        if (!force && this._cache[name] === value) {
            return;
        }
        this._logger.log('set_uniform({0}: {1})', name, value);
        const gl = this._runtime.gl;
        const uniform = this._uniforms[name];
        if (!uniform) {
            throw this._logger.error('uniform "{0}" is unknown', name);
        }
        const setter = (uniform.isArray ? uniformArraySetters : uniformSetters)[uniform.info.type];
        if (!setter) {
            throw this._logger.error('uniform "{0}" setter is not found', name);
        }
        // Program must be set as CURRENT_PROGRAM before gl.uniformXXX is called.
        // Otherwise it would cause an error.
        // > INVALID_OPERATION: uniformXXX: location is not from current program
        this.use();
        setter(this._logger, gl, uniform, value);
        this._cache[name] = value;
    }
}
