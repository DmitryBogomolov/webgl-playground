import { BaseWrapper } from './base-wrapper';
import { ContextView } from './context-view';

export class VertexArrayObject extends BaseWrapper<WebGLVertexArrayObjectOES> {
    protected _createHandle(): WebGLVertexArrayObjectOES {
        return this._context.vaoExt().createVertexArrayOES()!;
    }

    protected _destroyHandle(handle: WebGLVertexArrayObjectOES): void {
        this._context.vaoExt().deleteVertexArrayOES(handle);
    }

    static contextMethods = {
        createVertexArrayObject(ctx: ContextView): VertexArrayObject {
            return new VertexArrayObject(ctx);
        },

        bindVertexArrayObject(ctx: ContextView, target: VertexArrayObject | null): void {
            ctx.logCall('bind_vertex_array_object', target ? target.id() : null);
            ctx.vaoExt().bindVertexArrayOES(target ? target.handle() : null);
        },
    };
}
