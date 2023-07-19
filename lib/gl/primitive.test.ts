import type { VertexAttributeInfo, VERTEX_ATTRIBUTE_TYPE } from './primitive.types';
import type { Runtime } from './runtime';
import { Primitive, validateVertexSchema } from './primitive';

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
            new Primitive(runtime);
            expect(createVertexArrayOES.mock.calls).toEqual([
                [],
            ]);
            expect(createBuffer.mock.calls).toEqual([
                [],
                [],
            ]);
        });
    });

    describe('validateVertexSchema', () => {
        it('handle empty list', () => {
            const attrs = validateVertexSchema({ attributes: [] });

            expect(attrs).toEqual([]);
        });

        it('validate type', () => {
            try {
                validateVertexSchema({
                    attributes: [{ type: 'test3' as VERTEX_ATTRIBUTE_TYPE }],
                });
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual(new Error('attribute 0: bad type: test3'));
            }
        });

        it('validate schema', () => {
            const attrs = validateVertexSchema({
                attributes: [
                    { type: 'float4' },
                    { type: 'byte3', normalized: true },
                    { type: 'ushort2' },
                ],
            });

            expect(attrs).toEqual<VertexAttributeInfo[]>([
                {
                    location: 0,
                    type: WebGLRenderingContext.prototype.FLOAT,
                    rank: 4,
                    size: 4,
                    stride: 24,
                    offset: 0,
                    normalized: false,
                },
                {
                    location: 1,
                    type: WebGLRenderingContext.prototype.BYTE,
                    rank: 3,
                    size: 1,
                    stride: 24,
                    offset: 16,
                    normalized: true,
                },
                {
                    location: 2,
                    type: WebGLRenderingContext.prototype.UNSIGNED_SHORT,
                    rank: 2,
                    size: 2,
                    stride: 24,
                    offset: 20,
                    normalized: false,
                },
            ]);
        });

        it('allow custom stride and offset', () => {
            const attrs = validateVertexSchema({
                attributes: [
                    { type: 'float2', offset: 4, stride: 24 },
                    { type: 'short3', offset: 48, stride: 12 },
                ],
            });

            expect(attrs).toEqual<VertexAttributeInfo[]>([
                {
                    location: 0,
                    type: WebGLRenderingContext.prototype.FLOAT,
                    rank: 2,
                    size: 4,
                    stride: 24,
                    offset: 4,
                    normalized: false,
                },
                {
                    location: 1,
                    type: WebGLRenderingContext.prototype.SHORT,
                    rank: 3,
                    size: 2,
                    stride: 12,
                    offset: 48,
                    normalized: false,
                },
            ]);
        });
    });
});
