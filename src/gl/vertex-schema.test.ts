import type { VERTEX_ATTRIBUTE_TYPE, VertexSchemaInfo } from './vertex-schema.types';
import { parseVertexSchema } from './vertex-schema';

describe('vertex-schema', () => {
    describe('parseVertexSchema', () => {
        it('handle empty list', () => {
            const attrs = parseVertexSchema({ attributes: [] });

            expect(attrs).toEqual<VertexSchemaInfo>({
                vertexSize: 0,
                attributes: [],
            });
        });

        it('validate type', () => {
            try {
                parseVertexSchema({
                    attributes: [{ type: 'test3' as VERTEX_ATTRIBUTE_TYPE }],
                });
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toEqual(new Error('attribute 0 - bad type: test3'));
            }
        });

        it('validate schema', () => {
            const attrs = parseVertexSchema({
                attributes: [
                    { type: 'float4' },
                    { type: 'byte3', normalized: true },
                    { type: 'ushort2' },
                ],
            });

            expect(attrs).toEqual<VertexSchemaInfo>({
                vertexSize: 24,
                attributes: [
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
                ],
            });
        });

        it('allow custom stride and offset', () => {
            const attrs = parseVertexSchema({
                attributes: [
                    { type: 'float2', offset: 4, stride: 24 },
                    { type: 'short3', offset: 48, stride: 12 },
                ],
            });

            expect(attrs).toEqual<VertexSchemaInfo>({
                vertexSize: 16,
                attributes: [
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
                ],
            });
        });
    });
});
