import { VertexArrayObject } from './vertex-array-object';
import './no-console-in-tests';

describe('vertex array object', () => {
    describe('VertexArrayObject', () => {
        /** @type {WebGLVertexArrayObjectOES} */
        let vao;
        /** @type {OES_vertex_array_object} */
        let vaoExt;
        /** @type {import('./program').Context} */
        let context;

        beforeEach(() => {
            vao = { tag: 'test-vao' };
            vaoExt = {
                createVertexArrayOES: jest.fn().mockReturnValue(vao),
                bindVertexArrayOES: jest.fn(),
            };
            context = {
                logCall() { },
                vaoExt() { return vaoExt; },
            };
        });

        it('has proper handle', () => {
            expect(new VertexArrayObject(context).handle()).toBe(vao);
        });

        it('create vertex array object', () => {
            expect(VertexArrayObject.contextMethods.createVertexArrayObject(context) instanceof VertexArrayObject).toEqual(true);
        });

        it('bind vertex array object', () => {
            VertexArrayObject.contextMethods.bindVertexArrayObject(context, new VertexArrayObject(context));
            VertexArrayObject.contextMethods.bindVertexArrayObject(context, null);

            expect(vaoExt.bindVertexArrayOES.mock.calls).toEqual([
                [vao],
                [null],
            ]);
        });
    });
});
