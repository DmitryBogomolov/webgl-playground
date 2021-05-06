import { VertexSchema } from './vertex-schema';
import { VertexWriter, FluentVertexWriter } from './vertex-writer';

describe('vertex writer', () => {
    const schema: VertexSchema = {
        attributes: [
            { name: 'f1', type: 'float', size: 2, bytes: 4, offset: 0, normalized: false, gltype: 0 },
            { name: 'f2', type: 'short', size: 1, bytes: 2, offset: 8, normalized: false, gltype: 0 },
            { name: 'f3', type: 'ubyte', size: 3, bytes: 1, offset: 12, normalized: false, gltype: 0 },
        ],
        vertexSize: 16,
        isPacked: false,
    };

    describe('VertexWriter', () => {
        it('write attributes', () => {
            const dv = new DataView(new ArrayBuffer(100));
            const writer = new VertexWriter(dv.buffer, schema);

            writer.writeAttribute(0, 'f1', [1.2, 2.3]);
            writer.writeAttribute(0, 'f2', [1200]);
            writer.writeAttribute(0, 'f3', [1, 2, 3]);
            writer.writeAttribute(1, 'f1', [2.3, 2.1]);
            writer.writeAttribute(1, 'f2', [1300]);
            writer.writeAttribute(1, 'f3', [2, 3, 4]);
            writer.writeAttribute(2, 'f1', [4.1, 3.1]);
            writer.writeAttribute(2, 'f2', [1400]);
            writer.writeAttribute(2, 'f3', [4, 2, 1]);

            let offset = 0;
            expect(dv.getFloat32(offset + 0, true)).toBeCloseTo(1.2);
            expect(dv.getFloat32(offset + 4, true)).toBeCloseTo(2.3);
            expect(dv.getInt16(offset + 8, true)).toEqual(1200);
            expect(dv.getUint8(offset + 12)).toEqual(1);
            expect(dv.getUint8(offset + 13)).toEqual(2);
            expect(dv.getUint8(offset + 14)).toEqual(3);

            offset += 16;
            expect(dv.getFloat32(offset + 0, true)).toBeCloseTo(2.3);
            expect(dv.getFloat32(offset + 4, true)).toBeCloseTo(2.1);
            expect(dv.getInt16(offset + 8, true)).toEqual(1300);
            expect(dv.getUint8(offset + 12)).toEqual(2);
            expect(dv.getUint8(offset + 13)).toEqual(3);
            expect(dv.getUint8(offset + 14)).toEqual(4);

            offset += 16;
            expect(dv.getFloat32(offset + 0, true)).toBeCloseTo(4.1);
            expect(dv.getFloat32(offset + 4, true)).toBeCloseTo(3.1);
            expect(dv.getInt16(offset + 8, true)).toEqual(1400);
            expect(dv.getUint8(offset + 12)).toEqual(4);
            expect(dv.getUint8(offset + 13)).toEqual(2);
            expect(dv.getUint8(offset + 14)).toEqual(1);
        });
    });

    describe('FluentVertexWriter', () => {
        it('write attributes', () => {
            const dv = new DataView(new ArrayBuffer(100));
            const writer = new FluentVertexWriter(dv.buffer, schema);

            writer.writeAttribute(0, 'f1', [1.2, 2.3]);
            writer.writeAttribute(0, 'f2', [1200]);
            writer.writeAttribute(0, 'f3', [1, 2, 3]);
            writer.writeAttribute(1, 'f1', [2.3, 2.1]);
            writer.writeAttribute(1, 'f2', [1300]);
            writer.writeAttribute(1, 'f3', [2, 3, 4]);
            writer.writeAttribute(2, 'f1', [4.1, 3.1]);
            writer.writeAttribute(2, 'f2', [1400]);
            writer.writeAttribute(2, 'f3', [4, 2, 1]);

            let offset = 0;
            expect(dv.getFloat32(offset + 0, true)).toBeCloseTo(1.2);
            expect(dv.getFloat32(offset + 4, true)).toBeCloseTo(2.3);
            expect(dv.getInt16(offset + 8, true)).toEqual(1200);
            expect(dv.getUint8(offset + 12)).toEqual(1);
            expect(dv.getUint8(offset + 13)).toEqual(2);
            expect(dv.getUint8(offset + 14)).toEqual(3);

            offset += 16;
            expect(dv.getFloat32(offset + 0, true)).toBeCloseTo(2.3);
            expect(dv.getFloat32(offset + 4, true)).toBeCloseTo(2.1);
            expect(dv.getInt16(offset + 8, true)).toEqual(1300);
            expect(dv.getUint8(offset + 12)).toEqual(2);
            expect(dv.getUint8(offset + 13)).toEqual(3);
            expect(dv.getUint8(offset + 14)).toEqual(4);

            offset += 16;
            expect(dv.getFloat32(offset + 0, true)).toBeCloseTo(4.1);
            expect(dv.getFloat32(offset + 4, true)).toBeCloseTo(3.1);
            expect(dv.getInt16(offset + 8, true)).toEqual(1400);
            expect(dv.getUint8(offset + 12)).toEqual(4);
            expect(dv.getUint8(offset + 13)).toEqual(2);
            expect(dv.getUint8(offset + 14)).toEqual(1);
        });
    });
});
