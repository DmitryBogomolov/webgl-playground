import type { Vec3, Vec3Mut } from './vec3.types';
import { upd3 } from './vec3.helper';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';

export class Vec3Impl implements Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toString(): string {
        return `(${this.x}, ${this.y}, ${this.z})`;
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
    return !!v && ('x' in (v as Vec3)) && ('y' in (v as Vec3)) && ('z' in (v as Vec3));
}

export function eq3(a: Vec3, b: Vec3, eps: number = FLOAT_EQ_EPS): boolean {
    return a === b || (
        eq(a.x, b.x, eps) && eq(a.y, b.y, eps) && eq(a.z, b.z, eps)
    );
}

export function isZero3(v: Vec3, eps: number = FLOAT_EQ_EPS): boolean {
    return eq(sqrlen3(v), 0, eps);
}

export function isUnit3(v: Vec3, eps: number = FLOAT_EQ_EPS): boolean {
    return eq(sqrlen3(v), 1, eps);
}

function v3(): Vec3Mut {
    return vec3(0, 0, 0) as Vec3Mut;
}

export function vec3str(v: Vec3): string {
    return `(${v.x}, ${v.y}, ${v.z})`;
}

export function clone3(v: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, v.x, v.y, v.z);
}

export function dot3(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function mul3(v: Vec3, k: number, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, v.x * k, v.y * k, v.z * k);
}

export function div3(v: Vec3, k: number, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, v.x / k, v.y / k, v.z / k);
}

export function mulc3(a: Vec3, b: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, a.x * b.x, a.y * b.y, a.z * b.z);
}

export function divc3(a: Vec3, b: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, a.x / b.x, a.y / b.y, a.z / b.z);
}

export function len3(v: Vec3): number {
    return Math.hypot(v.x, v.y, v.z);
}

export function sqrlen3(v: Vec3): number {
    return dot3(v, v);
}

export function neg3(v: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, -v.x, -v.y, -v.z);
}

export function inv3(v: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, 1 / v.x, 1 / v.y, 1 / v.z);
}

export function norm3(v: Vec3, out: Vec3Mut = v3()): Vec3 {
    return mul3(v, 1 / len3(v), out);
}

const _dist3_aux = v3();
export function dist3(a: Vec3, b: Vec3): number {
    return len3(sub3(a, b, _dist3_aux));
}

export function dir3(a: Vec3, b: Vec3, out: Vec3Mut = v3()): Vec3 {
    return norm3(sub3(b, a, out), out);
}

const _sqrdist3_aux = v3();
export function sqrdist3(a: Vec3, b: Vec3): number {
    return sqrlen3(sub3(a, b, _sqrdist3_aux));
}

export function add3(a: Vec3, b: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, a.x + b.x, a.y + b.y, a.z + b.z);
}

export function sub3(a: Vec3, b: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out, a.x - b.x, a.y - b.y, a.z - b.z);
}

export function cross3(a: Vec3, b: Vec3, out: Vec3Mut = v3()): Vec3 {
    return upd3(out,
        a.y * b.z - a.z * b.y,
        -a.x * b.z + a.z * b.x,
        a.x * b.y - a.y * b.x,
    );
}

export function rotate3(v: Vec3, axis: Vec3, rotation: number, out: Vec3Mut = v3()): Vec3 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const t = 1 - c;
    const { x, y, z } = norm3(axis, out);
    return upd3(out,
        v.x * (x * x * t + c) + v.y * (x * y * t - z * s) + v.z * (x * z * t + y * s),
        v.x * (y * x * t - z * s) + v.y * (y * y * t + c) + v.z * (y * z * t - x * s),
        v.x * (z * x * t - y * s) + v.y * (z * y * t + x * s) + v.z * (z * z * t + c),
    );
}

const _collinear3_aux = v3();
export function collinear3(a: Vec3, b: Vec3, eps: number = FLOAT_EQ_EPS): boolean {
    return isZero3(cross3(a, b, _collinear3_aux), eps);
}

export function orthogonal3(a: Vec3, b: Vec3, eps: number = FLOAT_EQ_EPS): boolean {
    return eq(dot3(a, b), 0, eps);
}

export function project3(v: Vec3, axis: Vec3, out: Vec3Mut = v3()): Vec3 {
    const n = norm3(axis, out);
    const len = dot3(v, n);
    return mul3(n, len, out);
}
