import { Attribute, parseVertexSchema } from './vertex-schema';

describe('vertex schema', () => {
    describe('VertexSchema', () => {
        it('handle empty list', () => {
            const schema = parseVertexSchema({ attributes: [] });

            expect(schema).toEqual({
                attributes: [],
                totalSize: 0,
                isPacked: false,
            });
        });

        it('validate type', () => {
            try {
                parseVertexSchema({
                    attributes: [
                        { name: 'field1', type: 'test3' },
                    ],
                });
                expect(true).toBe(false);
            } catch (e) {
                expect((e as Error).message).toMatch('item "field1" type "test3" name is not valid');
            }
        });

        it('validate size', () => {
            try {
                parseVertexSchema({
                    attributes: [
                        { name: 'field1', type: 'float5' },
                    ],
                });
                expect(true).toBe(false);
            } catch (e) {
                expect((e as Error).message).toMatch('item "field1" type "float5" size is not valid');
            }
        });

        it('make aligned schema', () => {
            const schema = parseVertexSchema({
                attributes: [
                    { name: 'field1', type: 'float4' },
                    { name: 'field2', type: 'byte3', normalized: true },
                    { name: 'field3', type: 'ushort2' },
                ],
            });

            const attr1: Attribute = {
                name: 'field1',
                type: 'float',
                size: 4,
                gltype: WebGLRenderingContext.prototype.FLOAT,
                stride: 24,
                offset: 0,
                bytes: 4,
                normalized: false,
            };
            const attr2: Attribute = {
                name: 'field2',
                type: 'byte',
                size: 3,
                gltype: WebGLRenderingContext.prototype.BYTE,
                stride: 24,
                offset: 16,
                bytes: 1,
                normalized: true,
            };
            const attr3: Attribute = {
                name: 'field3',
                type: 'ushort',
                size: 2,
                gltype: WebGLRenderingContext.prototype.UNSIGNED_SHORT,
                stride: 24,
                offset: 20,
                bytes: 2,
                normalized: false,
            };
            expect(schema).toEqual({
                attributes: [attr1, attr2, attr3],
                totalSize: 24,
                isPacked: false,
            });
        });

        it('make packed schema', () => {
            const schema = parseVertexSchema({
                attributes: [
                    { name: 'field1', type: 'float4' },
                    { name: 'field2', type: 'byte3', normalized: true },
                    { name: 'field3', type: 'ushort2' },
                ],
                isPacked: true,
            });

            const attr1: Attribute = {
                name: 'field1',
                type: 'float',
                size: 4,
                gltype: WebGLRenderingContext.prototype.FLOAT,
                stride: 23,
                offset: 0,
                bytes: 4,
                normalized: false,
            };
            const attr2: Attribute = {
                name: 'field2',
                type: 'byte',
                size: 3,
                gltype: WebGLRenderingContext.prototype.BYTE,
                stride: 23,
                offset: 16,
                bytes: 1,
                normalized: true,

            };
            const attr3: Attribute = {
                name: 'field3',
                type: 'ushort',
                size: 2,
                gltype: WebGLRenderingContext.prototype.UNSIGNED_SHORT,
                stride: 23,
                offset: 19,
                bytes: 2,
                normalized: false,
            };
            expect(schema).toEqual({
                attributes: [attr1, attr2, attr3],
                totalSize: 23,
                isPacked: true,
            });
        });

        it('allow custom stride and offset', () => {
            const schema = parseVertexSchema({
                attributes: [
                    { name: 'field1', type: 'float2', offset: 2, stride: 10 },
                    { name: 'field2', type: 'short3', offset: 50, stride: 5 },
                ],
                isCustom: true,
            });

            const attr1: Attribute = {
                name: 'field1',
                type: 'float',
                size: 2,
                gltype: WebGLRenderingContext.prototype.FLOAT,
                stride: 10,
                offset: 2,
                bytes: 4,
                normalized: false,
            };
            const attr2: Attribute = {
                name: 'field2',
                type: 'short',
                size: 3,
                gltype: WebGLRenderingContext.prototype.SHORT,
                stride: 5,
                offset: 50,
                bytes: 2,
                normalized: false,
            };
            expect(schema).toEqual({
                attributes: [attr1, attr2],
                totalSize: 16,
                isPacked: false,
            });
        });
    });
});
