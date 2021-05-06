import { VertexBuffer, IndexBuffer } from './buffer';
import { ContextView } from './context-view';

describe('buffer', () => {
    let buffer: WebGLBuffer;
    let ctx: WebGLRenderingContext;
    let context: ContextView;
    let createBuffer: jest.Mock;
    let bindBuffer: jest.Mock;
    let bufferData: jest.Mock;

    beforeEach(() => {
        buffer = { tag: 'test-buffer' };
        createBuffer = jest.fn().mockReturnValue(buffer);
        bindBuffer = jest.fn();
        bufferData = jest.fn();
        ctx = {
            createBuffer,
            bindBuffer,
            bufferData,
        } as unknown as WebGLRenderingContext;
        context = {
            logCall() { /* empty */ },
            handle() { return ctx; },
        } as unknown as ContextView;
    });

    describe('VertexBuffer', () => {
        it('has proper target', () => {
            expect(new VertexBuffer(context).target()).toEqual(WebGLRenderingContext.prototype.ARRAY_BUFFER);
        });

        it('has proper handle', () => {
            expect(new VertexBuffer(context).handle()).toBe(buffer);
        });

        it('set data', () => {
            const stubBuffer = new ArrayBuffer(100);
            new VertexBuffer(context).setData(stubBuffer);

            expect(bufferData.mock.calls[0]).toEqual(['#ARRAY_BUFFER', stubBuffer, '#STATIC_DRAW']);
        });

        it('create buffer', () => {
            expect(VertexBuffer.contextMethods.createVertexBuffer(context) instanceof VertexBuffer).toEqual(true);
        });

        it('bind buffer', () => {
            VertexBuffer.contextMethods.bindVertexBuffer(context, new VertexBuffer(context));
            VertexBuffer.contextMethods.bindVertexBuffer(context, null);

            expect(bindBuffer.mock.calls).toEqual([
                ['#ARRAY_BUFFER', buffer],
                ['#ARRAY_BUFFER', null],
            ]);
        });
    });

    describe('IndexBuffer', () => {
        it('has proper target', () => {
            expect(new IndexBuffer(context).target()).toEqual(WebGLRenderingContext.prototype.ELEMENT_ARRAY_BUFFER);
        });

        it('has proper handle', () => {
            expect(new IndexBuffer(context).handle()).toBe(buffer);
        });

        it('set data', () => {
            const stubBuffer = new ArrayBuffer(100);
            new IndexBuffer(context).setData(stubBuffer);

            expect(bufferData.mock.calls[0]).toEqual(['#ELEMENT_ARRAY_BUFFER', stubBuffer, '#STATIC_DRAW']);
        });

        it('create buffer', () => {
            expect(IndexBuffer.contextMethods.createIndexBuffer(context) instanceof IndexBuffer).toEqual(true);
        });

        it('bind buffer', () => {
            IndexBuffer.contextMethods.bindIndexBuffer(context, new IndexBuffer(context));
            IndexBuffer.contextMethods.bindIndexBuffer(context, null);

            expect(bindBuffer.mock.calls).toEqual([
                ['#ELEMENT_ARRAY_BUFFER', buffer],
                ['#ELEMENT_ARRAY_BUFFER', null],
            ]);
        });
    });
});
