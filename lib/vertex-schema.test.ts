import { VertexSchema } from './vertex-schema';
import './no-console-in-tests';

describe('vertex schema', () => {
    describe('VertexSchema', () => {
        it('parse empty list', () => {
            const schema = new VertexSchema([]);

            expect(schema.items).toEqual([]);
            expect(schema.vertexSize).toEqual(0);
            expect(schema.isPacked).toEqual(false);
        });

        it('parse', () => {
            const schema = new VertexSchema([
                { name: 'field1', type: 'float4' },
                { name: 'field2', type: 'byte3', normalized: true },
                { name: 'field3', type: 'ushort2' },
            ]);

            const item1 = {
                name: 'field1',
                type: 'float',
                size: 4,
                gltype: '#FLOAT',
                offset: 0,
                bytes: 4,
                normalized: false,
            };
            const item2 = {
                name: 'field2',
                type: 'byte',
                size: 3,
                gltype: '#BYTE',
                offset: 16,
                bytes: 1,
                normalized: true,
                
            };
            const item3 = {
                name: 'field3',
                type: 'ushort',
                size: 2,
                gltype: '#UNSIGNED_SHORT',
                offset: 20,
                bytes: 2,
                normalized: false,
            };
            expect(schema.items).toEqual([item1, item2, item3]);
            expect(schema.vertexSize).toEqual(24);
            expect(schema.isPacked).toEqual(false);
        });

        it('parse packed', () => {
            const schema = new VertexSchema([
                { name: 'field1', type: 'float4' },
                { name: 'field2', type: 'byte3', normalized: true },
                { name: 'field3', type: 'ushort2' },
            ], { packed: true });

            const item1 = {
                name: 'field1',
                type: 'float',
                size: 4,
                gltype: '#FLOAT',
                offset: 0,
                bytes: 4,
                normalized: false,
            };
            const item2 = {
                name: 'field2',
                type: 'byte',
                size: 3,
                gltype: '#BYTE',
                offset: 16,
                bytes: 1,
                normalized: true,
                
            };
            const item3 = {
                name: 'field3',
                type: 'ushort',
                size: 2,
                gltype: '#UNSIGNED_SHORT',
                offset: 19,
                bytes: 2,
                normalized: false,
            };
            expect(schema.items).toEqual([item1, item2, item3]);
            expect(schema.vertexSize).toEqual(23);
            expect(schema.isPacked).toEqual(true);
        });
    });
});
