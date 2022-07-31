import {
    Runtime,
    Texture,
} from 'lib';

export function makeTexture(runtime: Runtime, onReady: () => void): Texture {
    const texture = new Texture(runtime);
    texture.setUnit(1);
    texture.setParameters({
        min_filter: 'nearest',
        mag_filter: 'nearest',
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
    });

    const image = new Image();
    image.src = '/static/mip-low-res-enlarged.png';
    image.onload = () => {
        image.onload = null;
        texture.setImageData(image, true);
        onReady();
    };

    return texture;
}
