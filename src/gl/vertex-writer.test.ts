import { parseVertexSchema } from './vertex-schema';
import { VertexWriter } from './vertex-writer';

describe('vertex writer', () => {
    describe('VertexWriter', () => {
        const schema = parseVertexSchema({
            attributes: [
                { type: 'float2' },
                { type: 'short' },
                { type: 'ubyte3' },
            ],
        });

        it('write attributes', () => {
            const dv = new DataView(new ArrayBuffer(100));
            const writer = new VertexWriter(schema, dv.buffer);

            writer.writeAttribute(0, 0, [1.2, 2.3]);
            writer.writeAttribute(0, 1, [1200]);
            writer.writeAttribute(0, 2, [1, 2, 3]);
            writer.writeAttribute(1, 0, { x: 2.3, y: 2.1 });
            writer.writeAttribute(1, 1, 1300);
            writer.writeAttribute(1, 2, { x: 2, y: 3, z: 4 });
            writer.writeAttribute(2, 0, [4.1, 3.1]);
            writer.writeAttribute(2, 1, [1400]);
            writer.writeAttribute(2, 2, [4, 2, 1]);

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
