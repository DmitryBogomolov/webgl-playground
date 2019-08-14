import { constants } from './constants';

const { STATIC_DRAW } = constants;

export class Buffer {
    constructor(context, target) {
        this._context = context;
        this._target = target;
        this._handle = this._context.handle().createBuffer();
    }

    dispose() {
        this._context.handle().deleteBuffer(this._handle);
    }

    handle() {
        return this._handle;
    }

    target() {
        return this._target;
    }

    bind() {
        this._context.handle().bindBuffer(this._target, this._handle);
    }

    unbind() {
        // TODO: Check that `this._handle` was bound.
        this._context.handle().bindBuffer(this._target, null);
    }

    setData(data) {
        this._context.handle().bufferData(this._target, data, STATIC_DRAW);
    }
}
