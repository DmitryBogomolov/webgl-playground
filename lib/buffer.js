import { log, warn } from './utils';
import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, 
    STATIC_DRAW,
} = constants;

export class ArrayBuffer extends BaseWrapper {
    _init() {
        this._handle = this._context.handle().createBuffer();
    }

    _dispose() {
        this._context.handle().deleteBuffer(this._handle);
    }

    target() {
        return this._target;
    }

    _bind(handle) {
        log(this._id, handle ? 'bind' : 'unbind');
        this._context.handle().bindBuffer(this._target, handle);
        this._updateState(handle);
    }

    bind() {
        if (this._matchState()) {
            warn(this._id, 'bind_already_bound');
            return;
        }
        this._bind(this._handle);
    }

    unbind() {
        if (!this._matchState()) {
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
