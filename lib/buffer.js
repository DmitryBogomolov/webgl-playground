import { STATIC_DRAW } from './constants';

export class Buffer {
    constructor(context, target) {
        this._context = context;
        this._target = target;
    }

    init() {
        this._handle = this._context._handle().createBuffer();
    }

    dispose() {
        this._context._handle().deleteBuffer(this._handle);
    }

    handle() {
        return this._handle;
    }

    target() {
        return this._target;
    }

    bind() {
        this._context._handle().bindBuffer(this._target, this._handle);
    }

    unbind() {
        // TODO: Check that `this._handle` was bound.
        this._context._handle().bindBuffer(this._target, null);
    }

    setData(data) {
        this._context._handle().bufferData(this._target, data, STATIC_DRAW);
    }
}
