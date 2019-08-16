import { log, warn, error } from './utils';
import { BaseWrapper } from './base-wrapper';
// This dependency exists only because of awkward patch.
import { ElementArrayBuffer } from './buffer';

export class VertexArrayObject extends BaseWrapper {
    _init() {
        this._handle = this._context.vaoExt().createVertexArrayOES();
    }

    _dispose() {
        this._context.vaoExt().deleteVertexArrayOES(this._handle);
    }

    _bind(handle) {
        log(this._id, handle ? 'bind' : 'unbind');
        this._context.vaoExt().bindVertexArrayOES(handle);
        this._updateState(handle);
        // This is an awkward patch.
        // Looks like vertex array object binding resets ELEMENT_ARRAY_BUFFER binding.
        if (handle) {
            this._context.setState(ElementArrayBuffer.prototype._stateKey, null);
        }
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
}

VertexArrayObject.prototype._idPrefix = 'VertexArrayObject';
VertexArrayObject.prototype._stateKey = 'bound_vertex_array_object';
