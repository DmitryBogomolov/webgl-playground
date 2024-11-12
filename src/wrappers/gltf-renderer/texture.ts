import type { GlTFAsset } from '../../gltf/asset.types';
import type { GlTFTexture } from '../../gltf/texture.types';
import type { TextureImageDataOptions } from '../../gl/texture-base.types';
import type { Runtime } from '../../gl/runtime';
import { Texture } from '../../gl/texture-2d';
import { getTextureInfo } from '../../gltf/texture';

export function createTextures(asset: GlTFAsset, runtime: Runtime): Promise<Texture[]> {
    const count = asset.gltf.textures ? asset.gltf.textures.length : 0;
    const tasks: Promise<Texture>[] = [];
    for (let i = 0; i < count; ++i) {
        const textureData = getTextureInfo(asset, i);
        const task = createTexture(textureData, runtime);
        tasks.push(task);
    }
    return Promise.all(tasks);
}

export function destroyTextures(textures: Iterable<Texture>): void {
    for (const texture of textures) {
        texture.dispose();
    }
}

const TEXTURE_DATA_OPTIONS: TextureImageDataOptions = {
    unpackFlipY: true,
    unpackColorSpaceConversion: 'none',
    unpackPremultiplyAlpha: false,
};

async function createTexture(textureInfo: GlTFTexture, runtime: Runtime): Promise<Texture> {
    const { data, mimeType, sampler } = textureInfo;
    const blob = new Blob([data], { type: mimeType });
    const bitmap = await createImageBitmap(blob);
    const texture = new Texture({ runtime });
    texture.setParameters({
        wrap_s: sampler.wrapS,
        wrap_t: sampler.wrapT,
        mag_filter: sampler.magFilter,
        min_filter: sampler.minFilter,
    });
    texture.setImageData(bitmap, TEXTURE_DATA_OPTIONS);
    return texture;
}

