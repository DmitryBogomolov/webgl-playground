export interface Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export class Vector3 implements Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/** (0, 0, 0) */
export const ZERO3 = vec3(0, 0, 0);

export function vec3(x: number, y: number, z: number): Vec3 {
    return new Vector3(x, y, z);
}

export function isVec3(v: unknown): v is Vec3 {
    return 'x' in (v as Vec3) && 'y' in (v as Vec3) && 'z' in (v as Vec3);
}

export function eq3(a: Vec3, b: Vec3): boolean {
    return a === b || (a.x === b.x && a.y === b.y && a.z === b.z);
}

// TODO: Consider removing it.
export function vec3arr(v: Vec3): [number, number, number] {
    return [v.x, v.y, v.z];
}

export function dot3(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function mul3(v: Vec3, k: number): Vec3 {
    return new Vector3(v.x * k, v.y * k, v.z * k);
}

export function len3(v: Vec3): number {
    return Math.hypot(v.x, v.y, v.z);
}

export function sqrlen3(v: Vec3): number {
    return dot3(v, v);
}

export function neg3(v: Vec3): Vec3 {
    return new Vector3(-v.x, -v.y, -v.z);
}

export function norm3(v: Vec3): Vec3 {
    return mul3(v, 1 / len3(v));
}
