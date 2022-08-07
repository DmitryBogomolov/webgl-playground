import {
    Runtime,
    Texture,
} from 'lib';

export function makeFillTexture(runtime: Runtime): Texture {
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
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
        mag_filter: 'nearest',
        min_filter: 'nearest',
    });
    texture.setImageData(
        { size: [8, 8], data },
        { generateMipmap: true, format: 'luminance' },
    );
    return texture;
}

export function makeMappingTexture(runtime: Runtime, onReady: () => void): Texture {
    const texture = new Texture(runtime);
    texture.setParameters({
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
        mag_filter: 'nearest',
        min_filter: 'nearest',
    });
    const image = new Image();
    image.src = '/static/f-letter.png';
    image.onload = () => {
        image.onload = null;
        texture.setImageData(image, { unpackFlipY: true, generateMipmap: true });
        onReady();
    };
    return texture;
}
