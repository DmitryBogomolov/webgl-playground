import { generateId, log, warn } from './utils';
import { constants } from './constants';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, 
    STATIC_DRAW,
} = constants;

export class ArrayBuffer {
    constructor(context) {
        this._id = generateId(this._idPrefix);
        this._context = context;
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
        log(this._id, handle ? 'bind' : 'unbind');
        this._context.handle().bindBuffer(this._target, handle);
        this._context.setState(this._stateKey, handle ? this._id : null);
    }

    bind() {
        if (this._context.getState(this._stateKey) === this._id) {
            warn(this._id, 'bind_already_bound');
            // TODO: vao bind resets ELEMENT_ARRAY_BUFFER bind.
            // return;
        }
        this._bind(this._handle);
    }

    unbind() {
        if (this._context.getState(this._stateKey) !== this._id) {
            error(this._id, new Error('not bound'));
        }
        this._bind(null);
    }

    setData(dataOrSize) {
        log(this._id, 'set_data');
        this._context.handle().bufferData(this._target, dataOrSize, STATIC_DRAW);
    }
}

ArrayBuffer.prototype._idPrefix = 'ArrayBuffer';
ArrayBuffer.prototype._target = ARRAY_BUFFER;
ArrayBuffer.prototype._stateKey = 'bound_array_buffer';

export class ElementArrayBuffer extends ArrayBuffer {
}

ElementArrayBuffer.prototype._idPrefix = 'ElementArrayBuffer';
ElementArrayBuffer.prototype._target = ELEMENT_ARRAY_BUFFER;
ElementArrayBuffer.prototype._stateKey = 'bound_element_array_buffer';
