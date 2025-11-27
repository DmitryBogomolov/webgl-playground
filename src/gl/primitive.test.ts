import type { Runtime } from './runtime';
import { Primitive } from './primitive';

describe('primitive', () => {
    describe('Primitive', () => {
        let vao: WebGLVertexArrayObjectOES;
        let vertexBuffer: WebGLBuffer;
        let indexBuffer: WebGLBuffer;
        let ctx: WebGL2RenderingContext;
        let runtime: Runtime;
        let createVertexArray: jest.Mock;
        let createBuffer: jest.Mock;

        beforeEach(() => {
            vao = { tag: 'vao' };
            vertexBuffer = { tag: 'vertex-buffer' };
            indexBuffer = { tag: 'index-buffer' };
            createVertexArray = jest.fn().mockReturnValueOnce(vao);
            createBuffer = jest.fn().mockReturnValueOnce(vertexBuffer).mockReturnValueOnce(indexBuffer);
            ctx = {
                createBuffer,
                createVertexArray,
            } as unknown as WebGL2RenderingContext;
            runtime = {
                gl: () => ctx,
                logger: () => null,
            } as unknown as Runtime;
        });

        it('create primitive', () => {
            new Primitive({ runtime });
            expect(createVertexArray.mock.calls).toEqual([
                [],
            ]);
            expect(createBuffer.mock.calls).toEqual([
                [],
                [],
            ]);
        });
    });
});
