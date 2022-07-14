export interface Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export class Vec3Impl implements Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export const ZERO3 = vec3(0, 0, 0);
export const XUNIT3 = vec3(1, 0, 0);
export const YUNIT3 = vec3(0, 1, 0);
export const ZUNIT3 = vec3(0, 0, 1);

export function vec3(x: number, y: number, z: number): Vec3 {
    return new Vec3Impl(x, y, z);
}

export function isVec3(v: unknown): v is Vec3 {
    return 'x' in (v as Vec3) && 'y' in (v as Vec3) && 'z' in (v as Vec3);
}

export function eq3(a: Vec3, b: Vec3): boolean {
    return a === b || (a.x === b.x && a.y === b.y && a.z === b.z);
}

export function dot3(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function mul3(v: Vec3, k: number): Vec3 {
    return vec3(v.x * k, v.y * k, v.z * k);
}

export function len3(v: Vec3): number {
    return Math.hypot(v.x, v.y, v.z);
}

export function sqrlen3(v: Vec3): number {
    return dot3(v, v);
}

export function neg3(v: Vec3): Vec3 {
    return vec3(-v.x, -v.y, -v.z);
}

export function norm3(v: Vec3): Vec3 {
    return mul3(v, 1 / len3(v));
}

export function add3(a: Vec3, b: Vec3): Vec3 {
    return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function sub3(a: Vec3, b: Vec3): Vec3 {
    return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
    return vec3(
        a.y * b.z - a.z * b.y,
        -a.x * b.z + a.z * b.x,
        a.x * b.y - a.y * b.x,
    );
}
