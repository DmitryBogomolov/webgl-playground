import { BaseWrapper } from './base-wrapper';
import { constants } from './constants';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, 
    STATIC_DRAW,
} = constants;

class BaseBuffer extends BaseWrapper {
    _init() {
        this._handle = this._context.handle().createBuffer();
    }

    _dispose() {
        this._context.handle().deleteBuffer(this._handle);
    }

    /** @returns {number} */
    target() {
        return this._target;
    }

    setData(/** @type {BufferSource} */data) {
        this._logger.log(`set_data(${data.length ? `buffer#${data.length}` : data})`);
        this._context.handle().bufferData(this._target, data, STATIC_DRAW);
    }
}

export class VertexBuffer extends BaseBuffer {
}

VertexBuffer.prototype._target = ARRAY_BUFFER;

export class IndexBuffer extends BaseBuffer {
}

IndexBuffer.prototype._target = ELEMENT_ARRAY_BUFFER;

/** @typedef {import('./context').Context} Context */

VertexBuffer.contextMethods = {
    createVertexBuffer(/** @type {Context} */ctx) {
        return new VertexBuffer(ctx);
    },

    bindVertexBuffer(/** @type {Context} */ctx, /** @type {VertexBuffer} */target) {
        ctx.logCall('bind_vertex_buffer', target ? target.id() : null);
        ctx.handle().bindBuffer(ARRAY_BUFFER, target ? target.handle() : null);
    }, 
};

IndexBuffer.contextMethods = {
    createIndexBuffer(/** @type {Context} */ctx) {
        return new IndexBuffer(ctx);
    },
    
    bindIndexBuffer(/** @type {Context} */ctx, /** @type {IndexBuffer} */target) {
        ctx.logCall('bind_index_buffer', target ? target.id() : null);
        ctx.handle().bindBuffer(ELEMENT_ARRAY_BUFFER, target ? target.handle() : null);
    },
};
