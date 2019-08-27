export const BLACK = color(0, 0, 0);
export const WHITE = color(1, 1, 1);

export function color(r, g, b, a = 1) {
    return { r, g, b, a };
}
