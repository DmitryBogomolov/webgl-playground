import { log, logCall, unwrapHandle } from './utils';
import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, 
    STATIC_DRAW,
} = constants;

// "ArrayBuffer" identifier is occupied.
export class ArrayBuf extends BaseWrapper {
    _init() {
        this._handle = this._context.handle().createBuffer();
    }

    _dispose() {
        this._context.handle().deleteBuffer(this._handle);
    }

    target() {
        return this._target;
    }

    bind() {
        this._context.bindArrayBuffer(this);
    }

    setData(dataOrSize) {
        log(this._id, 'set_data');
        this._context.handle().bufferData(this._target, dataOrSize, STATIC_DRAW);
    }
}

export function bindArrayBuffer(context, target) {
    logCall(context, 'bind_array_buffer', target);
    context.handle().bindBuffer(ARRAY_BUFFER, unwrapHandle(target));
}

ArrayBuf.prototype._idPrefix = 'ArrayBuffer';
ArrayBuf.prototype._target = ARRAY_BUFFER;

export class ElementArrayBuf extends ArrayBuf {
    bind() {
        this._context.bindElementArrayBuffer(this);
    }
}

ElementArrayBuf.prototype._idPrefix = 'ElementArrayBuffer';
ElementArrayBuf.prototype._target = ELEMENT_ARRAY_BUFFER;

export function bindElementArrayBuffer(context, target) {
    logCall(context, 'bind_element_array_buffer', target);
    context.handle().bindBuffer(ELEMENT_ARRAY_BUFFER, unwrapHandle(target));
}
