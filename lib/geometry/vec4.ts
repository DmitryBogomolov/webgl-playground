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
export const UNIT4 = vec4(1, 1, 1, 1);
export const XUNIT4 = vec4(1, 0, 0, 0);
export const YUNIT4 = vec4(0, 1, 0, 0);
export const ZUNIT4 = vec4(0, 0, 1, 0);
export const WUNIT4 = vec4(0, 0, 0, 1);

export function vec4(x: number, y: number, z: number, w: number): Vec4 {
    return new Vec4Impl(x, y, z, w);
}

export function isVec4(v: unknown): v is Vec4 {
    return 'x' in (v as Vec4) && 'y' in (v as Vec4) && 'z' in (v as Vec4) && 'w' in (v as Vec4);
}

export function eq4(a: Vec4, b: Vec4, eps: number = 1E-7): boolean {
    return a === b || (
        Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps
        && Math.abs(a.z - b.z) <= eps && Math.abs(a.w - b.w) <= eps
    );
}

export function dot4(a: Vec4, b: Vec4): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

export function mul4(v: Vec4, k: number): Vec4 {
    return vec4(v.x * k, v.y * k, v.z * k, v.w * k);
}

export function len4(v: Vec4): number {
    return Math.hypot(v.x, v.y, v.z, v.w);
}

export function sqrlen4(v: Vec4): number {
    return dot4(v, v);
}

export function neg4(v: Vec4): Vec4 {
    return vec4(-v.x, -v.y, -v.z, -v.w);
}

export function norm4(v: Vec4): Vec4 {
    return mul4(v, 1 / len4(v));
}

export function add4(a: Vec4, b: Vec4): Vec4 {
    return vec4(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w);
}

export function sub4(a: Vec4, b: Vec4): Vec4 {
    return vec4(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
}
