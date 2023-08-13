import type { GlTFAsset } from './asset.types';
import { getBinaryData } from './binary-data';

describe('binary-data', () => {
    describe('getBinaryData', () => {
        function arr(start: number, end: number): Uint8Array {
            const list: number[] = [];
            for (let i = start; i !== end; ++i) {
                list.push(i);
            }
            return new Uint8Array(list);
        }

        it('extract data', () => {
            const asset: GlTFAsset = {
                gltf: {
                    asset: { version: 'x' },
                    buffers: [
                        { byteLength: 0 }, { byteLength: 16 }, { byteLength: 0 }, { byteLength: 16 },
                    ],
                    bufferViews: [
                        { buffer: 1, byteLength: 8 },
                        { buffer: 3, byteLength: 4, byteOffset: 6 },
                        { buffer: 1, byteLength: 10 },
                        { buffer: 3, byteLength: 12, byteOffset: 2 },
                    ],
                },
                buffers: new Map<number, ArrayBuffer>([
                    [1, arr(10, 26).buffer],
                    [3, arr(20, 36).buffer],
                ]),
                images: new Map<number, ArrayBuffer>(),
            };
            expect(
                getBinaryData(asset, 0, 0, undefined),
            ).toEqual(arr(10, 18));
            expect(
                getBinaryData(asset, 0, 2, undefined),
            ).toEqual(arr(12, 20));
            expect(
                getBinaryData(asset, 0, 2, 4),
            ).toEqual(arr(12, 16));
            expect(
                getBinaryData(asset, 1, 0, undefined),
            ).toEqual(arr(26, 30));
            expect(
                getBinaryData(asset, 1, 2, undefined),
            ).toEqual(arr(28, 32));
            expect(
                getBinaryData(asset, 2, 0, undefined),
            ).toEqual(arr(10, 20));
            expect(
                getBinaryData(asset, 3, 0, undefined),
            ).toEqual(arr(22, 34));
        });
    });
});
