import type { GlTFMaterial } from './material.types';
import { getMaterialInfo } from './material';

describe('material', () => {
    describe('getMaterialInfo', () => {
        it('parse material', () => {
            expect(
                getMaterialInfo(
                    { asset: { version: 'x' } },
                    { attributes: {} },
                ),
            ).toEqual(null);
            expect(
                getMaterialInfo(
                    { asset: { version: 'x' }, materials: [{}, {}] },
                    { attributes: {}, material: 1 },
                ),
            ).toEqual(null);
            expect(
                getMaterialInfo(
                    {
                        asset: { version: 'x' },
                        materials: [
                            {},
                            {
                                pbrMetallicRoughness: {
                                    baseColorFactor: [0.1, 0.2, 0.3, 0.4],
                                    metallicFactor: 0.6,
                                    roughnessFactor: 0.7,
                                    baseColorTexture: {
                                        index: 4,
                                    },
                                    metallicRoughnessTexture: {
                                        index: 5,
                                    },
                                },
                            },
                        ],
                    },
                    { attributes: {}, material: 1 },
                ),
            ).toEqual<GlTFMaterial>({
                baseColorFactor: { r: 0.1, g: 0.2, b: 0.3, a: 0.4 },
                metallicFactor: 0.6,
                roughnessFactor: 0.7,
                baseColorTextureIndex: 4,
                metallicRoughnessTextureIndex: 5,
            });
        });
    });
});
