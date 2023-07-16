import type { GlTF_ACCESSOR_TYPE } from './accessor.types';
import { getAccessorType, getAccessorStride } from './accessor';

describe('accessor', () => {
    describe('getAccessorType', () => {
        it('parse accessor type', () => {
            expect(
                getAccessorType({ count: 0, type: 'SCALAR', componentType: 5123 }),
            ).toEqual<GlTF_ACCESSOR_TYPE>('ushort1');
            expect(
                getAccessorType({ count: 0, type: 'VEC2', componentType: 5126 }),
            ).toEqual<GlTF_ACCESSOR_TYPE>('float2');
            expect(
                getAccessorType({ count: 0, type: 'VEC3', componentType: 5120 }),
            ).toEqual<GlTF_ACCESSOR_TYPE>('byte3');
            expect(
                getAccessorType({ count: 0, type: 'VEC4', componentType: 5125 }),
            ).toEqual<GlTF_ACCESSOR_TYPE>('uint4');
        });
    });

    describe('getAccessorStride', () => {
        it('parse accessor stride', () => {
            expect(
                getAccessorStride(
                    {
                        asset: { version: 'x' },
                        bufferViews: [{ buffer: 0, byteLength: 0 }],
                    },
                    { bufferView: 0, count: 0, type: 'SCALAR', componentType: 5123 },
                ),
            ).toEqual(2);
            expect(
                getAccessorStride(
                    {
                        asset: { version: 'x' },
                        bufferViews: [{ buffer: 0, byteLength: 0 }],
                    },
                    { bufferView: 0, count: 0, type: 'VEC2', componentType: 5126 },
                ),
            ).toEqual(8);
            expect(
                getAccessorStride(
                    {
                        asset: { version: 'x' },
                        bufferViews: [{ buffer: 0, byteLength: 0 }],
                    },
                    { bufferView: 0, count: 0, type: 'VEC3', componentType: 5120 },
                ),
            ).toEqual(3);
            expect(
                getAccessorStride(
                    {
                        asset: { version: 'x' },
                        bufferViews: [{ buffer: 0, byteLength: 0 }],
                    },
                    { bufferView: 0, count: 0, type: 'VEC4', componentType: 5125 },
                ),
            ).toEqual(16);
            expect(
                getAccessorStride(
                    {
                        asset: { version: 'x' },
                        bufferViews: [{ buffer: 0, byteLength: 0, byteStride: 1 }],
                    },
                    { bufferView: 0, count: 0, type: 'VEC4', componentType: 5125 },
                ),
            ).toEqual(1);
        });
    });
});
