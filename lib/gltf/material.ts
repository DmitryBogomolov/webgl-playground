import type { GlTFMaterial } from './material.types';
import type { GlTFAsset, GlTFSchema } from './asset.types';
import { color } from '../common/color';

const DEFAULT_BASE_COLOR_FACTOR = color(1, 1, 1, 1);
const DEFAULT_METALLIC_FACTOR = 1;
const DEFAULT_ROUGHNESS_FACTOR = 1;

export function getMaterialInfo(asset: GlTFAsset, primitive: GlTFSchema.MeshPrimitive): GlTFMaterial | null {
    if (primitive.material === undefined) {
        return null;
    }
    const { pbrMetallicRoughness: pbr } = asset.gltf.materials![primitive.material];
    if (!pbr) {
        return null;
    }
    const baseColorFactor = pbr.baseColorFactor !== undefined
        ? color(...pbr.baseColorFactor as [number, number, number, number])
        : DEFAULT_BASE_COLOR_FACTOR;
    const metallicFactor = pbr.metallicFactor !== undefined
        ? pbr.metallicFactor
        : DEFAULT_METALLIC_FACTOR;
    const roughnessFactor = pbr.roughnessFactor !== undefined
        ? pbr.roughnessFactor
        : DEFAULT_ROUGHNESS_FACTOR;
    const baseColorTextureIndex = pbr.baseColorTexture
        ? pbr.baseColorTexture.index
        : undefined;
    const metallicRoughnessTextureIndex = pbr.metallicRoughnessTexture
        ? pbr.metallicRoughnessTexture.index
        : undefined;
    return {
        baseColorFactor,
        metallicFactor,
        roughnessFactor,
        baseColorTextureIndex,
        metallicRoughnessTextureIndex,
    };
}
