import type { Color, TextureImageData } from 'lib';
import { color2uint, colors } from 'lib';

export const pixels: ReadonlyArray<Color> = [
    colors.BLACK, colors.BLUE, colors.GREEN, colors.CYAN,
    colors.RED, colors.MAGENTA, colors.YELLOW, colors.WHITE,
    colors.WHITE, colors.YELLOW, colors.MAGENTA, colors.RED,
    colors.CYAN, colors.GREEN, colors.BLUE, colors.BLACK,
];

export const TEXTURE_SIZE: number = 4;

export function makeTextureData(): TextureImageData {
    const data = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4);
    const view = new Uint32Array(data.buffer);
    for (let i = 0; i < view.length; ++i) {
        view[i] = color2uint(pixels[i]);
    }
    return {
        size: { x: TEXTURE_SIZE, y: TEXTURE_SIZE },
        data,
    };
}
