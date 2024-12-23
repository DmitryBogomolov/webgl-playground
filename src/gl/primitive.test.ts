import type { Runtime } from './runtime';
import { Primitive } from './primitive';

describe('primitive', () => {
    describe('Primitive', () => {
        let vao: WebGLVertexArrayObjectOES;
        let vertexBuffer: WebGLBuffer;
        let indexBuffer: WebGLBuffer;
        let ctx: WebGLRenderingContext;
        let vaoExt: OES_vertex_array_object;
        let runtime: Runtime;
        let createVertexArrayOES: jest.Mock;
        let createBuffer: jest.Mock;

        beforeEach(() => {
            vao = { tag: 'vao' };
            vertexBuffer = { tag: 'vertex-buffer' };
            indexBuffer = { tag: 'index-buffer' };
            createVertexArrayOES = jest.fn().mockReturnValueOnce(vao);
            createBuffer = jest.fn().mockReturnValueOnce(vertexBuffer).mockReturnValueOnce(indexBuffer);
            ctx = {
                createBuffer,
            } as unknown as WebGLRenderingContext;
            vaoExt = {
                createVertexArrayOES,
            } as unknown as OES_vertex_array_object;
            runtime = {
                gl: () => ctx,
                vaoExt: () => vaoExt,
                logger: () => null,
            } as unknown as Runtime;
        });

        it('create primitive', () => {
            new Primitive({ runtime });
            expect(createVertexArrayOES.mock.calls).toEqual([
                [],
            ]);
            expect(createBuffer.mock.calls).toEqual([
                [],
                [],
            ]);
        });
    });
});
