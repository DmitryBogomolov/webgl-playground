import type { Color } from './color.types';

export class ColorImpl implements Color {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;

    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toString(): string {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}

export function color(r: number, g: number, b: number, a: number = 1): Color {
    return new ColorImpl(r, g, b, a);
}

export function isColor(arg: unknown): arg is Color {
    return Boolean(
        arg &&
        Number.isFinite((arg as Color).r) &&
        Number.isFinite((arg as Color).g) &&
        Number.isFinite((arg as Color).b) &&
        Number.isFinite((arg as Color).a),
    );
}

export function colorEq(lhs: Color, rhs: Color, eps: number = 1E-7): boolean {
    return lhs === rhs || (
        Math.abs(lhs.r - rhs.r) <= eps &&
        Math.abs(lhs.g - rhs.g) <= eps &&
        Math.abs(lhs.b - rhs.b) <= eps &&
        Math.abs(lhs.a - rhs.a) <= eps
    );
}

export function color2uint({ r, g, b, a }: Color): number {
    return (((r * 0xFF) << 0) | ((g * 0xFF) << 8) | ((b * 0xFF) << 16) | ((a * 0xFF) << 24)) >>> 0;
}

export function uint2color(hex: number): Color {
    const r = ((hex >>> 0) & 0xFF) / 0xFF;
    const g = ((hex >>> 8) & 0xFF) / 0xFF;
    const b = ((hex >>> 16) & 0xFF) / 0xFF;
    const a = ((hex >>> 24) & 0xFF) / 0xFF;
    return color(r, g, b, a);
}

function toHex(val: number): string {
    return (val * 0xFF).toString(16).padStart(2, '0').toUpperCase();
}

export function color2hex({ r, g, b, a }: Color): string {
    return '#' + toHex(r) + toHex(g) + toHex(b) + toHex(a);
}

function fromHex(val: string): number {
    return parseInt(val, 16) / 0xFF;
}

export function hex2color(hex: string): Color {
    if (hex[0] !== '#') {
        return color(0, 0, 0, 0);
    }
    const len = hex.length - 1;
    let r = '', g = '', b = '', a = '';
    if (len === 3 || len === 4) {
        r = hex[1] + hex[1];
        g = hex[2] + hex[2];
        b = hex[3] + hex[3];
        a = len === 4 ? hex[4] + hex[4] : 'FF';
    } else if (len === 6 || len === 8) {
        r = hex[1] + hex[2];
        g = hex[3] + hex[4];
        b = hex[5] + hex[6];
        a = len === 8 ? hex[7] + hex[8] : 'FF';
    }
    return color(fromHex(r), fromHex(g), fromHex(b), fromHex(a));
}

export const colors = {
    /** (0, 0, 0, 0) */
    NONE: color(0, 0, 0, 0),
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
    MAGENTA: color(1, 0, 1),
    /** (1, 1, 0) */
    YELLOW: color(1, 1, 0),
    /** (1, 1, 1) */
    WHITE: color(1, 1, 1),
};
