import { generateId, log } from './utils';
import { constants } from './constants';

const { STATIC_DRAW } = constants;

export class Buffer {
    constructor(context, target) {
        this._id = generateId('Buffer');
        this._context = context;
        this._target = target;
        log(this._id, 'init');
        this._handle = this._context.handle().createBuffer();
    }

    dispose() {
        log(this._id, 'dispose');
        this._context.handle().deleteBuffer(this._handle);
    }

    handle() {
        return this._handle;
    }

    target() {
        return this._target;
    }

    _bind(handle) {
        this._context.handle().bindBuffer(this._target, handle);
    }

    bind() {
        this._bind(this._handle);
    }

    unbind() {
        // TODO: Check that `this._handle` was bound.
        this._bind(null);
    }

    setData(dataOrSize) {
        log(this._id, 'set_data');
        this._context.handle().bufferData(this._target, dataOrSize, STATIC_DRAW);
    }
}
