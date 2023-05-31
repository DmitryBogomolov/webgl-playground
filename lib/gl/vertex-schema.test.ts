import type { Attribute, ATTRIBUTE_TYPE } from './vertex-schema.types';
import { parseVertexSchema } from './vertex-schema';

describe('vertex schema', () => {
    describe('VertexSchema', () => {
        it('handle empty list', () => {
            const schema = parseVertexSchema([]);

            expect(schema).toEqual({
                attributes: [],
                totalSize: 0,
            });
        });

        it('validate type', () => {
            try {
                parseVertexSchema([
                    { name: 'field1', type: 'test3' as ATTRIBUTE_TYPE },
                ]);
                expect(true).toBe(false);
            } catch (e) {
                expect((e as Error).message).toMatch('item "field1" type "test3" name is not valid');
            }
        });

        it('validate size', () => {
            try {
                parseVertexSchema([
                    { name: 'field1', type: 'float5' as ATTRIBUTE_TYPE },
                ]);
                expect(true).toBe(false);
            } catch (e) {
                expect((e as Error).message).toMatch('item "field1" type "float5" size is not valid');
            }
        });

        it('make schema', () => {
            const schema = parseVertexSchema([
                { name: 'field1', type: 'float4' },
                { name: 'field2', type: 'byte3', normalized: true },
                { name: 'field3', type: 'ushort2' },
            ]);

            const attr1: Attribute = {
                name: 'field1',
                location: 0,
                type: 'float',
                size: 4,
                gltype: WebGLRenderingContext.prototype.FLOAT,
                stride: 24,
                offset: 0,
                normalized: false,
            };
            const attr2: Attribute = {
                name: 'field2',
                location: 1,
                type: 'byte',
                size: 3,
                gltype: WebGLRenderingContext.prototype.BYTE,
                stride: 24,
                offset: 16,
                normalized: true,
            };
            const attr3: Attribute = {
                name: 'field3',
                location: 2,
                type: 'ushort',
                size: 2,
                gltype: WebGLRenderingContext.prototype.UNSIGNED_SHORT,
                stride: 24,
                offset: 20,
                normalized: false,
            };
            expect(schema).toEqual({
                attributes: [attr1, attr2, attr3],
                totalSize: 24,
            });
        });

        it('allow custom stride and offset', () => {
            const schema = parseVertexSchema([
                { name: 'field1', type: 'float2', offset: 4, stride: 20 },
                { name: 'field2', type: 'short3', offset: 48, stride: 12 },
            ]);

            const attr1: Attribute = {
                name: 'field1',
                location: 0,
                type: 'float',
                size: 2,
                gltype: WebGLRenderingContext.prototype.FLOAT,
                stride: 20,
                offset: 4,
                normalized: false,
            };
            const attr2: Attribute = {
                name: 'field2',
                location: 1,
                type: 'short',
                size: 3,
                gltype: WebGLRenderingContext.prototype.SHORT,
                stride: 12,
                offset: 48,
                normalized: false,
            };
            expect(schema).toEqual({
                attributes: [attr1, attr2],
                totalSize: 56,
            });
        });
    });
});
