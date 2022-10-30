import type { Plane3 } from './types/plane3';
import type { Line3 } from './types/line3';
import type { Vec3 } from './types/vec3';
import { XUNIT3, YUNIT3, ZUNIT3, isVec3, isZero3, eq3, norm3, neg3, cross3 } from './vec3';
import { line3 } from './line3';
import { floatEq, FLOAT_EQ_EPS } from './float-eq';

export class Plane3Impl implements Plane3 {
    readonly normal: Vec3;
    readonly distance: number;

    constructor(normal: Vec3, distance: number) {
        this.normal = normalizeNormal(normal);
        this.distance = distance;
    }
}

function normalizeNormal(normal: Vec3): Vec3 {
    const n = norm3(normal);
    return n.x >= 0 ? n : neg3(n);
}

export const XOY3 = plane3(ZUNIT3, 0);
export const YOZ3 = plane3(XUNIT3, 0);
export const ZOX3 = plane3(YUNIT3, 0);

export function plane3(normal: Vec3, distance: number): Plane3 {
    return new Plane3Impl(normal, distance);
}

export function isPlane3(p: unknown): p is Plane3 {
    return !!p && (isVec3((p as Plane3).normal) && 'distance' in (p as Plane3));
}

export function plane3eq(a: Plane3, b: Plane3, eps: number = FLOAT_EQ_EPS): boolean {
    return a === b || (floatEq(a.distance, b.distance, eps) && eq3(a.normal, b.normal, eps));
}

export function plane3plane3intersect(a: Plane3, b: Plane3): Line3 | number {
    const direction = cross3(a.normal, b.normal);
    if (isZero3(direction)) {
        return Math.abs(a.distance - b.distance);
    }
    // TODO...
    return line3(direction, direction);
}

export function plane3line3intersect(p: Plane3, l: Line3): Vec3 | number {
    // TODO...
    return 0;
}
