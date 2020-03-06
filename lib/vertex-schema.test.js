import { parseSchema } from './vertex-schema';

describe('vertex schema', () => {
    describe('parseSchema', () => {
        it('parse empty list', () => {
            const schema = [];

            expect(parseSchema(schema)).toEqual({
                items: [],
                vertexSize: 0,
                isPacked: false,
            });
        });

        it('parse', () => {
            const schema = [
                { name: 'field1', type: 'float4' },
                { name: 'field2', type: 'byte3', normalized: true },
                { name: 'field3', type: 'ushort2' },
            ];

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
            expect(parseSchema(schema)).toEqual({
                items: [item1, item2, item3],
                vertexSize: 24,
                isPacked: false,
            });
        });

        it('parse packed', () => {
            const schema = [
                { name: 'field1', type: 'float4' },
                { name: 'field2', type: 'byte3', normalized: true },
                { name: 'field3', type: 'ushort2' },
            ];

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
            expect(parseSchema(schema, { packed: true })).toEqual({
                items: [item1, item2, item3],
                vertexSize: 23,
                isPacked: true,
            });
        });
    });
});
