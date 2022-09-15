import { UniformValue, ProgramOptions, ProgramRuntime } from './types/program';
import { VertexSchema } from './types/vertex-schema';
import { GLHandleWrapper } from './types/gl-handle-wrapper';
import { BaseWrapper } from './base-wrapper';
import { Logger } from '../utils/logger';
import { isVec2 } from '../geometry/vec2';
import { isVec3 } from '../geometry/vec3';
import { isVec4 } from '../geometry/vec4';
import { isMat2 } from '../geometry/mat2';
import { isMat3 } from '../geometry/mat3';
import { isMat4 } from '../geometry/mat4';
import { isColor } from './color';
import { formatStr } from '../utils/string-formatter';

const WebGL = WebGLRenderingContext.prototype;

const GL_VERTEX_SHADER = WebGL.VERTEX_SHADER;
const GL_FRAGMENT_SHADER = WebGL.FRAGMENT_SHADER;
const GL_LINK_STATUS = WebGL.LINK_STATUS;
const GL_ACTIVE_ATTRIBUTES = WebGL.ACTIVE_ATTRIBUTES;
const GL_ACTIVE_UNIFORMS = WebGL.ACTIVE_UNIFORMS;

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

const shaderTypes: ShaderTypesMap = {
    [WebGL.FLOAT]: { type: 'float', size: 1 },
    [WebGL.FLOAT_VEC2]: { type: 'float', size: 2 },
    [WebGL.FLOAT_VEC3]: { type: 'float', size: 3 },
    [WebGL.FLOAT_VEC4]: { type: 'float', size: 4 },
    [WebGL.INT]: { type: 'int', size: 1 },
    [WebGL.INT_VEC2]: { type: 'int', size: 2 },
    [WebGL.INT_VEC3]: { type: 'int', size: 3 },
    [WebGL.INT_VEC4]: { type: 'int', size: 4 },
    [WebGL.BOOL]: { type: 'bool', size: 1 },
    [WebGL.BOOL_VEC2]: { type: 'bool', size: 2 },
    [WebGL.BOOL_VEC3]: { type: 'bool', size: 3 },
    [WebGL.BOOL_VEC4]: { type: 'bool', size: 4 },
    [WebGL.FLOAT_MAT2]: { type: 'float', size: 4 },
    [WebGL.FLOAT_MAT3]: { type: 'float', size: 9 },
    [WebGL.FLOAT_MAT4]: { type: 'float', size: 16 },
    [WebGL.SAMPLER_2D]: { type: 'sampler', size: 1 },
};

function isNumArray(arg: unknown, length: number): arg is number[] {
    return Array.isArray(arg) && arg.length >= length;
}

const uniformSetters: UniformSettersMap = {
    [WebGL.BOOL]: (logger, gl, { location }, value) => {
        if (typeof value === 'number' || typeof value === 'boolean') {
            gl.uniform1i(location, Number(value));
        } else {
            throw logger.error('bad value for "bool" uniform: {0}', value);
        }

    },
    [WebGL.FLOAT]: (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (isNumArray(value, 1)) {
            gl.uniform1fv(location, value);
        } else {
            throw logger.error('bad value for "float" uniform: {0}', value);
        }
    },
    [WebGL.FLOAT_VEC2]: (logger, gl, { location }, value) => {
        if (isVec2(value)) {
            gl.uniform2f(location, value.x, value.y);
        } else if (isNumArray(value, 2)) {
            gl.uniform2fv(location, value);
        } else {
            throw logger.error('bad value for "vec2" uniform: {0}', value);
        }
    },
    [WebGL.FLOAT_VEC3]: (logger, gl, { location }, value) => {
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
    [WebGL.FLOAT_VEC4]: (logger, gl, { location }, value) => {
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
    [WebGL.SAMPLER_2D]: (logger, gl, { location }, value) => {
        if (typeof value === 'number') {
            gl.uniform1i(location, value);
        } else {
            throw logger.error('bad value for "sampler2D" uniform: {0}', value);
        }
    },
    [WebGL.FLOAT_MAT2]: (logger, gl, { location }, value) => {
        if (isMat2(value)) {
            gl.uniformMatrix2fv(location, false, value as number[]);
        } else if (isNumArray(value, 4)) {
            gl.uniformMatrix2fv(location, false, value);
        } else {
            throw logger.error('bad value for "mat2" uniform: {0}', value);
        }
    },
    [WebGL.FLOAT_MAT3]: (logger, gl, { location }, value) => {
        if (isMat3(value)) {
            gl.uniformMatrix3fv(location, false, value as number[]);
        } else if (isNumArray(value, 9)) {
            gl.uniformMatrix3fv(location, false, value);
        } else {
            throw logger.error('bad value for "mat3" uniform: {0}', value);
        }
    },
    [WebGL.FLOAT_MAT4]: (logger, gl, { location }, value) => {
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
    [WebGL.BOOL]: (logger, gl, { location, info }, value) => {
        if (isNumArray(value, info.size)) {
            gl.uniform1iv(location, value);
        } else {
            throw logger.error('bad value for "bool[{1}]" uniform: {0}', value, info.size);
        }

    },
    [WebGL.FLOAT]: (logger, gl, { location, info }, value) => {
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

export class Program extends BaseWrapper implements GLHandleWrapper<WebGLProgram> {
    private readonly _runtime: ProgramRuntime;
    private readonly _vertexShader: WebGLShader;
    private readonly _fragmentShader: WebGLShader;
    private readonly _schema: VertexSchema;
    // private readonly _attributes: AttributesMap = {};
    private readonly _uniforms: UniformsMap = {};
    private readonly _program: WebGLProgram;

    constructor(runtime: ProgramRuntime, options: ProgramOptions, tag?: string) {
        super(tag);
        this._logger.log('init');
        this._runtime = runtime;
        this._schema = options.schema;
        try {
            this._program = this._createProgram();
            this._vertexShader = this._createShader(GL_VERTEX_SHADER, options.vertexShader);
            this._fragmentShader = this._createShader(GL_FRAGMENT_SHADER, options.fragmentShader);
            this._bindAttributes();
            this._linkProgram();
            /* this._attributes = */this._collectAttributes();
            this._uniforms = this._collectUniforms();
        } catch (err) {
            this._dispose();
            throw err;
        }
    }

    dispose(): void {
        this._logger.log('dispose');
        this._dispose();
    }

    glHandle(): WebGLProgram {
        return this._program;
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
        if (shader) {
            gl.detachShader(this._program, shader);
            gl.deleteShader(shader);
        }
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
        if (!gl.getProgramParameter(this._program, GL_LINK_STATUS)) {
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
            throw this._logger.error(message);
        }
    }

    private _collectAttributes(): AttributesMap {
        const gl = this._runtime.gl;
        const program = this._program;
        const count = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES) as number;
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
                // TODO: How should this be properly processed?
                this._logger.warn('attribute "{0}" is unknown', attr.name);
                continue;
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
        const count = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS) as number;
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
        this._runtime.useProgram(this);
    }

    setUniform(name: string, value: UniformValue): void {
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
    }
}
