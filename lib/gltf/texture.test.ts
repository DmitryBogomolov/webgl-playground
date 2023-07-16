import type { GlTFTexture } from './texture.types';
import type { GlTFAsset } from './asset.types';
import { getTextureInfo } from './texture';

describe('texture', () => {
    describe('getTextureInfo', () => {
        it('parse texture data', () => {
            const asset: GlTFAsset = {
                gltf: {
                    asset: { version: 'x' },
                    buffers: [
                        { byteLength: 0 }, { byteLength: 16 },
                    ],
                    bufferViews: [
                        { buffer: 1, byteLength: 4 },
                    ],
                    textures: [
                        { source: 0 },
                        { source: 1, sampler: 0 },
                    ],
                    samplers: [
                        { wrapS: 33071, wrapT: 33648, magFilter: 9728, minFilter: 9986 },
                    ],
                    images: [
                        { bufferView: 0, mimeType: 'test-type-1' },
                        { mimeType: 'test-type-2' },
                    ],
                },
                buffers: new Map<number, ArrayBuffer>([
                    [1, new Uint8Array([11, 12, 13, 14]).buffer],
                ]),
                images: new Map<number, ArrayBuffer>([
                    [1, new Uint8Array([21, 22, 23, 24]).buffer],
                ]),
            };
            expect(
                getTextureInfo(asset, 0),
            ).toEqual<GlTFTexture>({
                data: new Uint8Array([11, 12, 13, 14]),
                mimeType: 'test-type-1',
                sampler: {
                    wrapS: 'repeat',
                    wrapT: 'repeat',
                },
            });
            expect(
                getTextureInfo(asset, 1),
            ).toEqual<GlTFTexture>({
                data: new Uint8Array([21, 22, 23, 24]),
                mimeType: 'test-type-2',
                sampler: {
                    wrapS: 'clamp_to_edge',
                    wrapT: 'mirrored_repeat',
                    magFilter: 'nearest',
                    minFilter: 'nearest_mipmap_linear',
                },
            });
        });
    });
});
