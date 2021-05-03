export interface Color {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
}

export function color(r: number, g: number, b: number, a: number = 1): Color {
    return { r, g, b, a };
}

export function color2array({ r, g, b, a }: Color): [number, number, number, number] {
    return [r, g, b, a];
}

export const colors = {
    /** (0, 0, 0) */
    BLACK: color(0, 0, 0),
    /** (0, 0, 1) */
    BLUE: color(0, 0, 1),
    /** (0, 1, 0) */
    GREEN: color(0, 1, 0),
    /** (0, 1, 1) */
    CYAN: color(0, 1, 1),
    /** (1, 0, 0) */
    RED: color(1, 0, 0),
    /** (1, 0, 1) */
    MAGENTA: color(1, 0, 0),
    /** (1, 1, 0) */
    YELLOW: color(1, 1, 0),
    /** (1, 1, 1) */
    WHITE: color(1, 1, 1),
};
