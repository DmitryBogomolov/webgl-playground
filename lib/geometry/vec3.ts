import { Vec3 } from './types/vec3';

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
export const UNIT3 = vec3(1, 1, 1);
export const XUNIT3 = vec3(1, 0, 0);
export const YUNIT3 = vec3(0, 1, 0);
export const ZUNIT3 = vec3(0, 0, 1);

export function vec3(x: number, y: number, z: number): Vec3 {
    return new Vec3Impl(x, y, z);
}

export function isVec3(v: unknown): v is Vec3 {
    return 'x' in (v as Vec3) && 'y' in (v as Vec3) && 'z' in (v as Vec3);
}

export function eq3(a: Vec3, b: Vec3, eps: number = 1E-7): boolean {
    return a === b || (
        Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps && Math.abs(a.z - b.z) <= eps
    );
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

export function inv3(v: Vec3): Vec3 {
    return vec3(1 / v.x, 1 / v.y, 1 / v.z);
}

export function norm3(v: Vec3): Vec3 {
    return mul3(v, 1 / len3(v));
}

export function dist3(a: Vec3, b: Vec3): number {
    return len3(sub3(a, b));
}

export function dir3(a: Vec3, b: Vec3): Vec3 {
    return norm3(sub3(b, a));
}

export function sqrdist3(a: Vec3, b: Vec3): number {
    return sqrlen3(sub3(a, b));
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

export function rotate3(v: Vec3, axis: Vec3, rotation: number): Vec3 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const t = 1 - c;
    const { x, y, z } = norm3(axis);
    return vec3(
        v.x * (x * x * t + c) + v.y * (x * y * t - z * s) + v.z * (x * z * t + y * s),
        v.x * (y * x * t - z * s) + v.y * (y * y * t + c) + v.z * (y * z * t - x * s),
        v.x * (z * x * t - y * s) + v.y * (z * y * t + x * s) + v.z * (z * z * t + c),
    );
}
