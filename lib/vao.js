import { generateId, log } from './utils';

export class VertexArrayObject {
    constructor(context) {
        this._id = generateId('VAO');
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
        this._context.vaoExt().bindVertexArrayOES(handle);
    }

    bind() {
        this._bind(this._handle);
    }

    unbind() {
        // TODO: Check that `this._handle` was bound.
        this._bind(null);
    }
}
