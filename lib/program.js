import { logCall, unwrapHandle } from './utils';
import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

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
    
    _createShader(type, source) {
        const ctx = this._context.handle();
        const shader = ctx.createShader(type);
        ctx.shaderSource(shader, source);
        ctx.compileShader(shader);
        if (!ctx.getShaderParameter(shader, COMPILE_STATUS)) {
            const err = ctx.getShaderInfoLog(shader);
            ctx.deleteShader(shader);
            this._error(new Error(err));
        }
        return shader;
    }

    _linkProgram(vertexShader, fragmentShader) {
        const ctx = this._context.handle();
        const program = this._handle;
        ctx.attachShader(program, vertexShader);
        ctx.attachShader(program, fragmentShader);
        ctx.linkProgram(program);
        if (!ctx.getProgramParameter(program, LINK_STATUS)) {
            const err = ctx.getProgramInfoLog(program);
            ctx.deleteShader(vertexShader);
            ctx.deleteShader(fragmentShader);
            ctx.deleteProgram(program);
            this._error(new Error(err));
        }
    }

    _collectAttributes() {
        const ctx = this._context.handle();
        const program = this._handle;
        const count = ctx.getProgramParameter(program, ACTIVE_ATTRIBUTES);
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

    setupVertexAttributes(schema) {
        this._log(`setup_vertex_attributes(${schema.items.length})`);
        const ctx = this._context.handle();
        const attributes = this._attributes;
        const stride = schema.vertexSize;
        schema.items.forEach((item) => {
            const attr = attributes[item.name];
            if (!attr) {
                this._error(new Error(`attribute "${item.name}" is unknown`));
            }
            // TODO: Validate type and size (if it is possible).
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
            ctx.vertexAttribPointer(
                attr.location, item.size, item.gltype, item.normalized, stride, item.offset
            );
            ctx.enableVertexAttribArray(attr.location);
        });
    }

    setUniform(name, value) {
        this._log(`set_uniform(${name},${value})`);
        const attr = this._uniforms[name];
        if (!attr) {
            this._error(new Error(`uniform "${name}" is unknown`));
        }
        const setter = uniformSetters[attr.type];
        if (!setter) {
            this._error(new Error(`uniform "${name}" setter is not found`));
        }
        this._context.handle()[setter](attr.location, value);
    }
}

Program.prototype._idPrefix = 'Program';

Program.contextMethods = {
    useProgram(context, target) {
        logCall(context, 'use_program', target);
        context.handle().useProgram(unwrapHandle(target));
    },
};
