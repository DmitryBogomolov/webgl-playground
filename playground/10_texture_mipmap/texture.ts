import type { Runtime } from 'lib';
import { Texture, loadImage } from 'lib';

export function makeTexture(runtime: Runtime, onReady: () => void): Texture {
    const texture = new Texture(runtime);
    loadImage('/static/mip-low-res-enlarged.png').then(
        (image) => {
            texture.setImageData(image, { unpackFlipY: true, generateMipmap: true });
            onReady();
        },
        console.error,
    );
    return texture;
}
