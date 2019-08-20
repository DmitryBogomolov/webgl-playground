import { logCall, unwrapHandle } from './utils';
import { BaseWrapper } from './base-wrapper';

export class VertexArrayObject extends BaseWrapper {
    _init() {
        this._handle = this._context.vaoExt().createVertexArrayOES();
    }

    _dispose() {
        this._context.vaoExt().deleteVertexArrayOES(this._handle);
    }

    bind() {
        this._context.bindVertexArrayObject(this);
    }
}

VertexArrayObject.prototype._idPrefix = 'VertexArrayObject';

export function bindVertexArrayObject(context, target) {
    logCall(context, 'bind_vertex_array_object', target);
    context.vaoExt().bindVertexArrayOES(unwrapHandle(target));
}
