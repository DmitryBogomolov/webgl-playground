import { uint2bytes, bytes2uint } from './uint-bytes';

describe('uint-bytes', () => {
    it('convert values', () => {
        expect(uint2bytes(0)).toEqual({ x: 0, y: 0, z: 0, w: 0 });
        expect(bytes2uint({ x: 0, y: 0, z: 0, w: 0 })).toEqual(0);

        expect(uint2bytes(1)).toEqual({ x: 1, y: 0, z: 0, w: 0 });
        expect(bytes2uint({ x: 1, y: 0, z: 0, w: 0 })).toEqual(1);

        expect(uint2bytes(127)).toEqual({ x: 127, y: 0, z: 0, w: 0 });
        expect(bytes2uint({ x: 127, y: 0, z: 0, w: 0 })).toEqual(127);

        expect(uint2bytes(2403)).toEqual({ x: 99, y: 9, z: 0, w: 0 });
        expect(bytes2uint({ x: 99, y: 9, z: 0, w: 0 })).toEqual(2403);

        expect(uint2bytes(10620931)).toEqual({ x: 3, y: 16, z: 162, w: 0 });
        expect(bytes2uint({ x: 3, y: 16, z: 162, w: 0 })).toEqual(10620931);

        expect(uint2bytes(134721988)).toEqual({ x: 196, y: 177, z: 7, w: 8 });
        expect(bytes2uint({ x: 196, y: 177, z: 7, w: 8 })).toEqual(134721988);
    });
});
