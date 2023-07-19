import type { GlTF_WRAP, GlTF_MAG_FILTER, GlTF_MIN_FILTER, GlTFTexture, GlTFTextureSampler } from './texture.types';
import type { GlTFAsset } from './asset.types';
import type { Mapping } from '../common/mapping.types';
import { getBinaryData } from './binary-data';

const MIN_FILTER_MAPPING: Mapping<number, GlTF_MIN_FILTER> = {
    [9728]: 'nearest',
    [9729]: 'linear',
    [9984]: 'nearest_mipmap_nearest',
    [9985]: 'linear_mipmap_nearest',
    [9986]: 'nearest_mipmap_linear',
    [9987]: 'linear_mipmap_linear',
};
const MAG_FILTER_MAPPING: Mapping<number, GlTF_MAG_FILTER> = {
    [9728]: 'nearest',
    [9729]: 'linear',
};
const WRAP_MAPPING: Mapping<number, GlTF_WRAP> = {
    [10497]: 'repeat',
    [33071]: 'clamp_to_edge',
    [33648]: 'mirrored_repeat',
};

const DEFAULT_SAMPLER: GlTFTextureSampler = {
    wrapS: 'repeat',
    wrapT: 'repeat',
};

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#texture-data
export function getTextureInfo(asset: GlTFAsset, idx: number): GlTFTexture {
    const texture = asset.gltf.textures![idx];
    const image = asset.gltf.images![texture.source!];
    let data: Uint8Array;
    if (image.bufferView !== undefined) {
        data = getBinaryData(asset, image.bufferView, 0, undefined);
    } else {
        const buffer = asset.images.get(texture.source!)!;
        data = new Uint8Array(buffer);
    }
    const mimeType = image.mimeType !== undefined ? image.mimeType as string : detectTextureMimeType(data);
    let sampler: GlTFTextureSampler;
    if (texture.sampler !== undefined) {
        const { wrapS, wrapT, minFilter, magFilter } = asset.gltf.samplers![texture.sampler];
        sampler = {
            wrapS: wrapS !== undefined ? WRAP_MAPPING[wrapS] : DEFAULT_SAMPLER.wrapS,
            wrapT: wrapT !== undefined ? WRAP_MAPPING[wrapT] : DEFAULT_SAMPLER.wrapT,
            minFilter: minFilter !== undefined ? MIN_FILTER_MAPPING[minFilter] : undefined,
            magFilter: magFilter !== undefined ? MAG_FILTER_MAPPING[magFilter] : undefined,
        };
    } else {
        sampler = { ...DEFAULT_SAMPLER };
    }
    return {
        data,
        mimeType,
        sampler,
    };
}

const PNG_PATTERN: ReadonlyArray<number> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const JPEG_PATTERN: ReadonlyArray<number> = [0xFF, 0xD8, 0xFF];

function matchPattern(data: Uint8Array, pattern: ReadonlyArray<number>): boolean {
    for (let i = 0; i < pattern.length; ++i) {
        if (pattern[i] !== data[i]) {
            return false;
        }
    }
    return true;
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images
function detectTextureMimeType(data: Uint8Array): string {
    if (matchPattern(data, PNG_PATTERN)) {
        return 'image/png';
    }
    if (matchPattern(data, JPEG_PATTERN)) {
        return 'image/jpeg';
    }
    throw new Error('mime type not detected');
}
