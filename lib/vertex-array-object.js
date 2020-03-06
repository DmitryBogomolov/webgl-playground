import { BaseWrapper } from './base-wrapper';

export class VertexArrayObject extends BaseWrapper {
    _init() {
        this._handle = this._context.vaoExt().createVertexArrayOES();
    }

    _dispose() {
        this._context.vaoExt().deleteVertexArrayOES(this._handle);
    }
}

/** @typedef {import('./context').Context} Context */

VertexArrayObject.contextMethods = {
    createVertexArrayObject(/** @type {Context} */ctx) {
        return new VertexArrayObject(ctx);
    },
    
    bindVertexArrayObject(/** @type {Context} */ctx, /** @type {VertexArrayObject} */target) {
        ctx.logCall('bind_vertex_array_object', target ? target.id() : null);
        ctx.vaoExt().bindVertexArrayOES(target ? target.handle() : null);
    },
};
