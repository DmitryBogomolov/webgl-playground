import {
    Runtime,
    Texture,
    loadImage,
} from 'lib';

export function makeColorTexture(runtime: Runtime): Texture {
    const texture = new Texture(runtime);
    const data = new Uint8Array(64);
    const c1 = 0xFF;
    const c2 = 0x7F;
    for (let i = 0; i < 8; ++i) {
        for (let j = 0; j < 8; ++j) {
            const c = (i + j) & 1 ? c2 : c1;
            data[i * 8 + j] = c;
        }
    }
    texture.setParameters({
        mag_filter: 'nearest',
        min_filter: 'nearest',
    });
    texture.setImageData(
        { size: { x: 8, y: 8 }, data },
        { generateMipmap: true, format: 'luminance' },
    );
    return texture;
}

export function makeMappingTexture(runtime: Runtime, onReady: () => void): Texture {
    const texture = new Texture(runtime);
    texture.setParameters({
        mag_filter: 'nearest',
        min_filter: 'nearest',
    });
    loadImage('/static/f-letter.png').then(
        (image) => {
            texture.setImageData(image, { unpackFlipY: true, generateMipmap: true });
            onReady();
        },
        console.error,
    );
    return texture;
}
