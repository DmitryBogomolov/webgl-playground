// TODO: Add more colors.
export const BLACK = color(0, 0, 0);
export const WHITE = color(1, 1, 1);

export interface Color {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
}

export function color(r: number, g: number, b: number, a: number = 1): Color {
    return { r, g, b, a };
}
