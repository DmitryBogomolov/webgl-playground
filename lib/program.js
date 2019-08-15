import { generateId, log, warn, error } from './utils';
import { constants } from './constants';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ACTIVE_ATTRIBUTES, ACTIVE_UNIFORMS,
} = constants;

export class Program {
    constructor(context, vertexShaderSource, fragmentShaderSource) {
        this._id = generateId('Program');
        this._context = context;
        this._vertexShaderSource = vertexShaderSource;
        this._fragmentShaderSource = fragmentShaderSource;
        this._init();
    }

    _init() {
        log(this._id, 'init');
        const ctx = this._context.handle();
        this._handle = ctx.createProgram();
        
        this._vertexShader = this._createShader(VERTEX_SHADER, this._vertexShaderSource);
        this._fragmentShader = this._createShader(FRAGMENT_SHADER, this._fragmentShaderSource);
        this._linkProgram(this._vertexShader, this._fragmentShader);

        this._attributes = this._collectAttributes();
        this._uniforms = this._collectUniforms();
    }

    dispose() {
        log(this._id, 'dispose');
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

    handle() {
        return this._handle;
    }

    _use(handle) {
        log(this._id, handle ? 'use' : 'unuse');
        this._context.handle().useProgram(handle);
        this._context.setState(this._stateKey, handle ? this._id : null);
    }

    use() {
        if (this._context.getState(this._stateKey) === this._id) {
            warn(this._id, 'use_already_used');
            return;
        }
        this._use(this._handle);
    }

    unuse() {
        if (this._context.getState(this._stateKey) !== this._id) {
            error(this._id, new Error('not used'));
        }
        this._use(null);
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

Program.prototype._stateKey = 'used_program';
