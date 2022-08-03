import {
    Runtime,
    Texture,
} from 'lib';

export function makeTexture(runtime: Runtime, onReady: () => void): Texture {
    const texture = new Texture(runtime);

    const image = new Image();
    image.src = '/static/leaves.jpg';
    image.onload = () => {
        image.onload = null;
        texture.setImageData(image, { unpackFlipY: true, generateMipmap: true });
        onReady();
    };

    return texture;
}
