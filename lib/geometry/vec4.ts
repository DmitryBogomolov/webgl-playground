export interface Vec4 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}

export class Vec4Impl implements Vec4 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;

    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

export const ZERO4 = vec4(0, 0, 0, 0);
export const XUNIT4 = vec4(1, 0, 0, 0);
export const YUNTI4 = vec4(0, 1, 0, 0);
export const ZUNIT4 = vec4(0, 0, 1, 0);
export const WUNIT4 = vec4(0, 0, 0, 1);

export function vec4(x: number, y: number, z: number, w: number): Vec4 {
    return new Vec4Impl(x, y, z, w);
}

export function isVec4(v: unknown): v is Vec4 {
    return 'x' in (v as Vec4) && 'y' in (v as Vec4) && 'z' in (v as Vec4) && 'w' in (v as Vec4);
}

export function eq4(a: Vec4, b: Vec4): boolean {
    return a === b || (a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w);
}

// TODO: Consider removing it.
export function vec4arr(v: Vec4): [number, number, number, number] {
    return [v.x, v.y, v.z, v.w];
}
