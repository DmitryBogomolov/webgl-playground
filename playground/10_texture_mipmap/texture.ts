import type { Runtime } from 'lib';
import { Texture, makeImage } from 'lib';

export function makeTexture(runtime: Runtime, onReady: () => void): Texture {
    const texture = new Texture(runtime);
    makeImage({ url: '/static/mip-low-res-enlarged.png' }).then(
        (image) => {
            texture.setImageData(image, { unpackFlipY: true });
            onReady();
        },
        console.error,
    );
    return texture;
}
