import { Color, colors, TextureData } from 'lib';

export const pixels: ReadonlyArray<Color> = [
    colors.BLACK, colors.BLUE, colors.GREEN, colors.CYAN,
    colors.RED, colors.MAGENTA, colors.YELLOW, colors.WHITE,
    colors.WHITE, colors.YELLOW, colors.MAGENTA, colors.RED,
    colors.CYAN, colors.GREEN, colors.BLUE, colors.BLACK,
];

export const TEXTURE_SIZE: number = 4;

const data = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4);
let i = 0;
for (const { r, g, b, a } of pixels) {
    data[i++] = r * 0xFF;
    data[i++] = g * 0xFF;
    data[i++] = b * 0xFF;
    data[i++] = a * 0xFF;
}

export const textureData: TextureData = {
    size: [TEXTURE_SIZE, TEXTURE_SIZE],
    data,
};
