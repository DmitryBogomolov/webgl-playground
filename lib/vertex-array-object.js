import { generateId, log, warn, error } from './utils';

export class VertexArrayObject {
    constructor(context) {
        this._id = generateId('VertexArrayObject');
        this._context = context;
        log(this._id, 'init');
        this._handle = this._context.vaoExt().createVertexArrayOES();
    }

    dispose() {
        log(this._id, 'dispose');
        this._context.vaoExt().deleteVertexArrayOES(this._handle);
    }

    handle() {
        return this._handle;
    }

    _bind(handle) {
        log(this._id, handle ? 'bind' : 'unbind');
        this._context.vaoExt().bindVertexArrayOES(handle);
        this._context.setState(this._stateKey, handle ? this._id : null);
    }

    bind() {
        if (this._context.getState(this._stateKey) === this._id) {
            warn(this._id, 'bind_already_bound');
            return;
        }
        this._bind(this._handle);
    }

    unbind() {
        if (this._context.getState(this._stateKey) !== this._id) {
            error(this._id, new Error('not bound'));
        }
        this._bind(null);
    }
}

VertexArrayObject.prototype._stateKey = 'bound_vertex_array_object';
