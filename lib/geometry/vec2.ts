import type { Vec2 } from './vec2.types';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';

export class Vec2Impl implements Vec2 {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export const ZERO2 = vec2(0, 0);
export const UNIT2 = vec2(1, 1);
export const XUNIT2 = vec2(1, 0);
export const YUNIT2 = vec2(0, 1);

export function vec2(x: number, y: number): Vec2 {
    return new Vec2Impl(x, y);
}

export function isVec2(v: unknown): v is Vec2 {
    return !!v && ('x' in (v as Vec2)) && ('y' in (v as Vec2));
}

export function eq2(a: Vec2, b: Vec2, eps: number = FLOAT_EQ_EPS): boolean {
    return a === b || (eq(a.x, b.x, eps) && eq(a.y, b.y, eps));
}

export function isZero2(v: Vec2, eps: number = FLOAT_EQ_EPS): boolean {
    return eq(sqrlen2(v), 0, eps);
}

export function isUnit2(v: Vec2, eps: number = FLOAT_EQ_EPS): boolean {
    return eq(sqrlen2(v), 1, eps);
}

export function add2(a: Vec2, b: Vec2): Vec2 {
    return vec2(a.x + b.x, a.y + b.y);
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
    return vec2(a.x - b.x, a.y - b.y);
}

export function dot2(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
}

export function mul2(v: Vec2, k: number): Vec2 {
    return vec2(v.x * k, v.y * k);
}

export function div2(v: Vec2, k: number): Vec2 {
    return vec2(v.x / k, v.y / k);
}

export function mul2c(a: Vec2, b: Vec2): Vec2 {
    return vec2(a.x * b.x, a.y * b.y);
}

export function div2c(a: Vec2, b: Vec2): Vec2 {
    return vec2(a.x / b.x, a.y / b.y);
}

export function len2(v: Vec2): number {
    return Math.hypot(v.x, v.y);
}

export function sqrlen2(v: Vec2): number {
    return dot2(v, v);
}

export function neg2(v: Vec2): Vec2 {
    return vec2(-v.x, -v.y);
}

export function inv2(v: Vec2): Vec2 {
    return vec2(1 / v.x, 1 / v.y);
}

export function norm2(v: Vec2): Vec2 {
    return mul2(v, 1 / len2(v));
}

export function dist2(a: Vec2, b: Vec2): number {
    return len2(sub2(a, b));
}

export function dir2(a: Vec2, b: Vec2): Vec2 {
    return norm2(sub2(b, a));
}

export function sqrdist2(a: Vec2, b: Vec2): number {
    return sqrlen2(sub2(a, b));
}

export function project2(v: Vec2, axis: Vec2): Vec2 {
    const n = norm2(axis);
    const len = dot2(v, n);
    return mul2(n, len);
}

export function pointToLineDistance2(point: Vec2, p1: Vec2, p2: Vec2): number {
    return Math.abs((p2.x - p1.x) * (p1.y - point.y) - (p1.x - point.x) * (p2.y - p1.y)) / dist2(p1, p2);
}
