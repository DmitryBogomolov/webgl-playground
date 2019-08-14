export class VertexArrayObject {
    constructor(context) {
        this._context = context;
        this._handle = this._context.vaoExt().createVertexArrayOES();
    }

    dispose() {
        this._context.vaoExt().deleteVertexArrayOES(this._handle);
    }

    handle() {
        return this._handle;
    }

    bind() {
        this._context.vaoExt().bindVertexArrayOES(this._handle);
    }

    unbind() {
        // TODO: Check that `this._handle` was bound.
        this._context.vaoExt().bindVertexArrayOES(null);
    }
}
