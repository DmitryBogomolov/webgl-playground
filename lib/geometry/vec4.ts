export interface Vec4 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}

export class Vector4 implements Vec4 {
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

/** (0, 0, 0, 0) */
export const ZERO4 = vec4(0, 0, 0, 0);

export function vec4(x: number, y: number, z: number, w: number): Vec4 {
    return new Vector4(x, y, z, w);
}

export function isVec4(arg: unknown): arg is Vec4 {
    return 'x' in (arg as Vec4) && 'y' in (arg as Vec4) && 'z' in (arg as Vec4) && 'w' in (arg as Vec4);
}

export function vec4eq(v1: Vec4, v2: Vec4): boolean {
    return v1 === v2 || (v1.x === v2.x && v1.y === v2.y && v1.z === v2.z && v1.w === v2.w);
}

export function vec4arr(v: Vec4): [number, number, number, number] {
    return [v.x, v.y, v.z, v.w];
}
