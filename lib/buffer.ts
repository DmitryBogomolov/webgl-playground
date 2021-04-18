import { BaseWrapper } from './base-wrapper';
import { contextConstants } from './context-constants';
import { ContextView } from './context-view';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, 
    STATIC_DRAW,
} = contextConstants;

class BaseBuffer extends BaseWrapper<WebGLBuffer> {
    protected readonly _target: number = -1;

    protected _createHandle(): WebGLBuffer {
        return this._context.handle().createBuffer()!;
    }

    protected _destroyHandle(handle: WebGLBuffer): void {
        this._context.handle().deleteBuffer(handle);
    }

    target(): number {
        return this._target;
    }

    setData(data: BufferSource): void {
        this._logger.log(`set_data(${data.byteLength ? `buffer#${data.byteLength}` : data})`);
        this._context.handle().bufferData(this._target, data, STATIC_DRAW);
    }
}

export class VertexBuffer extends BaseBuffer {
    protected readonly _target = ARRAY_BUFFER;

    static contextMethods = {
        createVertexBuffer(ctx: ContextView) {
            return new VertexBuffer(ctx);
        },
    
        bindVertexBuffer(ctx: ContextView, target: VertexBuffer | null) {
            ctx.logCall('bind_vertex_buffer', target ? target.id() : null);
            ctx.handle().bindBuffer(ARRAY_BUFFER, target ? target.handle() : null);
        }, 
    };
}

export class IndexBuffer extends BaseBuffer {
    protected readonly _target = ELEMENT_ARRAY_BUFFER;

    static contextMethods = {
        createIndexBuffer(ctx: ContextView) {
            return new IndexBuffer(ctx);
        },
        
        bindIndexBuffer(ctx: ContextView, target: IndexBuffer | null) {
            ctx.logCall('bind_index_buffer', target ? target.id() : null);
            ctx.handle().bindBuffer(ELEMENT_ARRAY_BUFFER, target ? target.handle() : null);
        },
    };
}
