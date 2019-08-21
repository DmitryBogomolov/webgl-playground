import { VertexWriter, FluentVertexWriter } from './vertex-writer';

describe('vertex writer', () => {
    const schema = {
        items: [
            { name: 'f1', type: 'float', size: 2, bytes: 4, offset: 0 },
            { name: 'f2', type: 'short', size: 1, bytes: 2, offset: 8 },
            { name: 'f3', type: 'ubyte', size: 3, bytes: 1, offset: 12 },
        ],
        byName: {},
        vertexSize: 16,
    };
    schema.items.forEach((item) => {
        schema.byName[item.name] = item;
    });

    describe('VertexWriter', () => {
        it('write fields', () => {
            const dv = new DataView(new ArrayBuffer(100));
            const writer = new VertexWriter(dv.buffer, schema);

            writer.writeField(0, 'f1', [1.2, 2.3]);
            writer.writeField(1, 'f2', [1200]);
            writer.writeField(2, 'f3', [2, 3, 4]);

            expect(dv.getFloat32(0, true)).toBeCloseTo(1.2);
            expect(dv.getFloat32(4, true)).toBeCloseTo(2.3);
            expect(dv.getInt16(24, true)).toEqual(1200);
            expect(dv.getUint8(44)).toEqual(2);
            expect(dv.getUint8(45)).toEqual(3);
            expect(dv.getUint8(46)).toEqual(4);
        });
    });  
    
    describe('FluentVertexWriter', () => {
        it('write fields', () => {
            const dv = new DataView(new ArrayBuffer(100));
            const writer = new FluentVertexWriter(dv.buffer, schema);

            writer.writeField(0, 'f1', [1.2, 2.3]);
            writer.writeField(1, 'f2', [1200]);
            writer.writeField(2, 'f3', [2, 3, 4]);

            expect(dv.getFloat32(0, true)).toBeCloseTo(1.2);
            expect(dv.getFloat32(4, true)).toBeCloseTo(2.3);
            expect(dv.getInt16(24, true)).toEqual(1200);
            expect(dv.getUint8(44)).toEqual(2);
            expect(dv.getUint8(45)).toEqual(3);
            expect(dv.getUint8(46)).toEqual(4);
        });
    });
});
