import { mapper } from '../utils/mapper';

export interface Vec2 {
    readonly x: number;
    readonly y: number;
}

export class Vector2 implements Vec2 {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/** (0, 0) */
export const ZERO2 = vec2(0, 0);

export function vec2(x: number, y: number): Vec2 {
    return new Vector2(x, y);
}

export function isVec2(arg: unknown): arg is Vec2 {
    return 'x' in (arg as Vec2) && 'y' in (arg as Vec2);
}

export function vec2eq(v1: Vec2, v2: Vec2): boolean {
    return v1 === v2 || (v1.x === v2.x && v1.y === v2.y);
}

export function vec2arr(v: Vec2): [number, number] {
    return [v.x, v.y];
}

export function add2(a: Vec2, b: Vec2): Vec2 {
    return new Vector2(a.x + b.x, a.y + b.y);
}

export function sub2(a: Vec2, b: Vec2): Vec2 {
    return new Vector2(a.x - b.x, a.y - b.y);
}

export function dot2(a: Vec2, b: Vec2): number {
    return a.x * b.x + a.y * b.y;
}

export function mul2(a: Vec2, k: number): Vec2 {
    return new Vector2(a.x * k, a.y * k);
}

export function len2(v: Vec2): number {
    return Math.hypot(v.x, v.y);
}

export function sqrlen2(v: Vec2): number {
    return dot2(v, v);
}

export function neg2(v: Vec2): Vec2 {
    return new Vector2(-v.x, -v.y);
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

export function pointToLineDistance2(point: Vec2, p1: Vec2, p2: Vec2): number {
    return Math.abs((p2.x - p1.x) * (p1.y - point.y) - (p1.x - point.x) * (p2.y - p1.y)) / dist2(p1, p2);
}

export function mapper2(from1: Vec2, from2: Vec2, to1: Vec2, to2: Vec2): (arg: Vec2) => Vec2 {
    const mapX = mapper(from1.x, from2.x, to1.x, to2.x);
    const mapY = mapper(from1.y, from2.y, to1.y, to2.y);
    return (v) => new Vector2(mapX(v.x), mapY(v.y));
}
