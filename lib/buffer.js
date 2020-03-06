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

    setData(/** @type {BufferSource} */data) {
        this._logger.log(`set_data(${data.length ? `buffer#${data.length}` : data})`);
        this._context.handle().bufferData(this._target, data, STATIC_DRAW);
    }
}

ArrayBuf.prototype._target = ARRAY_BUFFER;

export class ElementArrayBuf extends ArrayBuf {
}

ElementArrayBuf.prototype._target = ELEMENT_ARRAY_BUFFER;

/** @typedef {import('./context').Context} Context */

ArrayBuf.contextMethods = {
    createArrayBuffer(/** @type {Context} */ctx) {
        return new ArrayBuf(ctx);
    },

    bindArrayBuffer(/** @type {Context} */ctx, /** @type {ArrayBuf} */target) {
        ctx.logCall('bind_array_buffer', target ? target.id() : null);
        ctx.handle().bindBuffer(ARRAY_BUFFER, target ? target.handle() : null);
    }, 
};

ElementArrayBuf.contextMethods = {
    createElementArrayBuffer(/** @type {Context} */ctx) {
        return new ElementArrayBuf(ctx);
    },
    
    bindElementArrayBuffer(/** @type {Context} */ctx, /** @type {ElementArrayBuf} */target) {
        ctx.logCall('bind_element_array_buffer', target ? target.id() : null);
        ctx.handle().bindBuffer(ELEMENT_ARRAY_BUFFER, target ? target.handle() : null);
    },
};
