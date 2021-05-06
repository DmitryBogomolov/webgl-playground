import { VertexArrayObject } from './vertex-array-object';
import { ContextView } from './context-view';

describe('vertex array object', () => {
    describe('VertexArrayObject', () => {
        let vao: WebGLVertexArrayObjectOES;
        let vaoExt: OES_vertex_array_object;
        let context: ContextView;
        let createVertexArrayOES: jest.Mock;
        let bindVertexArrayOES: jest.Mock;

        beforeEach(() => {
            vao = { tag: 'test-vao' };
            createVertexArrayOES = jest.fn().mockReturnValue(vao);
            bindVertexArrayOES = jest.fn();
            vaoExt = {
                createVertexArrayOES,
                bindVertexArrayOES,
            } as unknown as OES_vertex_array_object;
            context = {
                logCall() { /* empty */ },
                vaoExt() { return vaoExt; },
            } as unknown as ContextView;
        });

        it('has proper handle', () => {
            expect(new VertexArrayObject(context).handle()).toBe(vao);
        });

        it('create vertex array object', () => {
            expect(VertexArrayObject.contextMethods.createVertexArrayObject(context) instanceof VertexArrayObject)
                .toEqual(true);
        });

        it('bind vertex array object', () => {
            VertexArrayObject.contextMethods.bindVertexArrayObject(context, new VertexArrayObject(context));
            VertexArrayObject.contextMethods.bindVertexArrayObject(context, null);

            expect(bindVertexArrayOES.mock.calls).toEqual([
                [vao],
                [null],
            ]);
        });
    });
});
