import type { GlTFAsset } from '../../gltf/asset.types';
import type { TextureImageDataOptions } from '../../gl/texture-base.types';
import type { Runtime } from '../../gl/runtime';
import { Texture } from '../../gl/texture-2d';
import { getTextureInfo } from '../../gltf/texture';

export function createTextures(asset: GlTFAsset, runtime: Runtime, callback: () => void): Texture[] {
    const count = asset.gltf.textures?.length || 0;
    const tasks: Promise<void>[] = [];
    const textures: Texture[] = [];
    for (let i = 0; i < count; ++i) {
        const { data, mimeType, sampler } = getTextureInfo(asset, i);
        const texture = new Texture({ runtime });
        texture.setParameters({
            wrap_s: sampler.wrapS,
            wrap_t: sampler.wrapT,
            mag_filter: sampler.magFilter,
            min_filter: sampler.minFilter,
        });
        const blob = new Blob([data], { type: mimeType });
        const task = createImageBitmap(blob).then((bitmap) => {
            texture.setImageData(bitmap, TEXTURE_DATA_OPTIONS);
        });
        textures.push(texture);
        tasks.push(task);
    }
    void Promise.all(tasks)
        .catch((err) => {
            console.error(err);
        })
        .then(callback);
    return textures;
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
