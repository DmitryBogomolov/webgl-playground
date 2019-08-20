import { log, error, logCall, unwrapHandle } from './utils';
import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
} = constants;

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
            error(this._id, new Error(err));
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
            error(this._id, new Error(err));
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
            const location = ctx.getUniformLocation(program, i);
            uniforms[name] = {
                location,
                size,
                type,
            };
        }
        return uniforms;
    }

    use() {
        this._context.useProgram(this);
    }

    setupVertexAttributes(schema) {
        log(this._id, 'setup_vertex_attributes');
        const ctx = this._context.handle();
        const attributes = this._attributes;
        const stride = schema.vertexSize();
        schema.items().forEach((item) => {
            // TODO: Match name, validate type and size
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getActiveUniform
            const location = attributes[item.name].location;
            ctx.vertexAttribPointer(
                location, item.size, item.gltype, item.normalized, stride, item.offset
            );
            ctx.enableVertexAttribArray(location);
        });
    }
}

Program.prototype._idPrefix = 'Program';

export function useProgram(context, target) {
    logCall(context, 'use_program', target);
    context.handle().useProgram(unwrapHandle(target));
}
