import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';
import { raiseError } from './utils';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
    FLOAT, FLOAT_VEC2, FLOAT_VEC3, FLOAT_VEC4,
    SAMPLER_2D,
} = constants;

const uniformSetters = {
    [FLOAT]: 'uniform1f',
    [FLOAT_VEC2]: 'uniform2fv',
    [FLOAT_VEC3]: 'uniform3fv',
    [FLOAT_VEC4]: 'uniform4fv',
    [SAMPLER_2D]: 'uniform1i',
};

/** @typedef {import('./vertex-schema').SchemaDesc} SchemaDesc */

/**
 * @typedef {Object} AttributeDesc
 * @property {number} location
 * @property {number} size
 * @property {number} type
 */

/**
 * @typedef {Object} UniformDesc
 * @property {WebGLUniformLocation} location
 * @property {number} size
 * @property {number} type
 */

export class Program extends BaseWrapper {
    _init() {
        const ctx = this._context.handle();
        this._handle = ctx.createProgram();
        
        this._vertexShader = this._createShader(VERTEX_SHADER, this._params.vertexShaderSource);
        this._fragmentShader = this._createShader(FRAGMENT_SHADER, this._params.fragmentShaderSource);
        this._linkProgram(this._vertexShader, this._fragmentShader);

        this._attributes = this._collectAttributes();
        this._uniforms = this._collectUniforms();
    }

    _dispose() {
        const ctx = this._context.handle();
        ctx.deleteShader(this._vertexShader);
        ctx.deleteShader(this._fragmentShader);
        ctx.deleteProgram(this._handle);
    }
    
    _createShader(/** @type {number} */type, /** @type {string} */source) {
        const ctx = this._context.handle();
        const shader = ctx.createShader(type);
        ctx.shaderSource(shader, source);
        ctx.compileShader(shader);
        if (!ctx.getShaderParameter(shader, COMPILE_STATUS)) {
            const info = ctx.getShaderInfoLog(shader);
            ctx.deleteShader(shader);
            raiseError(this._logger, info);
        }
        return shader;
    }

    _linkProgram(/** @type {WebGLShader} */vertexShader, /** @type {WebGLShader} */fragmentShader) {
        const ctx = this._context.handle();
        const program = this._handle;
        ctx.attachShader(program, vertexShader);
        ctx.attachShader(program, fragmentShader);
        ctx.linkProgram(program);
        if (!ctx.getProgramParameter(program, LINK_STATUS)) {
            ctx.deleteShader(vertexShader);
            ctx.deleteShader(fragmentShader);
            const info = ctx.getProgramInfoLog(program);
            ctx.deleteProgram(program);
            raiseError(this._logger, info);
        }
    }

    _collectAttributes() {
        const ctx = this._context.handle();
        const program = this._handle;
        const count = ctx.getProgramParameter(program, ACTIVE_ATTRIBUTES);
        /** @type {{ [name: string]: AttributeDesc }} */
        const attributes = {};
        for (let i = 0; i < count; ++i) {
            const { name, size, type } = ctx.getActiveAttrib(program, i);
            const location = ctx.getAttribLocation(program, name);
            attributes[name] = {
                location,
                size,
                type,
            };
        }
        return attributes;
    }

    _collectUniforms() {
        const ctx = this._context.handle();
        const program = this._handle;
        const count = ctx.getProgramParameter(program, ACTIVE_UNIFORMS);
        /** @type {{ [name: string]: UniformDesc }} */
        const uniforms = {};
        for (let i = 0; i < count; ++i) {
            const { name, size, type } = ctx.getActiveUniform(program, i);
            const location = ctx.getUniformLocation(program, name);
            uniforms[name] = {
                location,
                size,
                type,
            };
        }
        return uniforms;
    }

    setupVertexAttributes(/** @type {SchemaDesc} */schema) {
        this._logger.log(`setup_vertex_attributes(${schema.items.length})`);
        const ctx = this._context.handle();
        const attributes = this._attributes;
        const stride = schema.vertexSize;
        schema.items.forEach((item) => {
            const attr = attributes[item.name];
            if (!attr) {
                raiseError(this._logger, `attribute "${item.name}" is unknown`);
            }
            // TODO: Validate type and size (if it is possible).
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
            ctx.vertexAttribPointer(
                attr.location, item.size, item.gltype, item.normalized, stride, item.offset
            );
            ctx.enableVertexAttribArray(attr.location);
        });
    }

    setUniform(/** @type {string} */name, /** @type {number} */value) {
        this._logger.log(`set_uniform(${name},${value})`);
        const attr = this._uniforms[name];
        if (!attr) {
            raiseError(this._logger, `uniform "${name}" is unknown`);
        }
        const setter = uniformSetters[attr.type];
        if (!setter) {
            raiseError(this._logger, `uniform "${name}" setter is not found`);
        }
        this._context.handle()[setter](attr.location, value);
    }
}

/** @typedef {import('./context').Context} Context */

Program.contextMethods = {
    createProgram(/** @type {Context} */ctx, params) {
        return new Program(ctx, params);
    },

    useProgram(/** @type {Context} */ctx, /** @type {Program} */target) {
        ctx.logCall('use_program', target ? target.id() : null);
        ctx.handle().useProgram(target ? target.handle() : null);
    },
};
