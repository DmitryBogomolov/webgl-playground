import type { Plane3 } from './types/plane3';
import type { Vec3 } from './types/vec3';
import { XUNIT3, YUNIT3, ZUNIT3, isVec3, eq3, norm3, cross3, sub3, isZero3, dot3 } from './vec3';
import { floatEq, FLOAT_EQ_EPS } from './float-eq';
import { normalizeDirection3 } from './dir-norm3';

export class Plane3Impl implements Plane3 {
    readonly normal: Vec3;
    readonly distance: number;

    constructor(normal: Vec3, distance: number) {
        this.normal = normalizeDirection3(normal);
        this.distance = dot3(normal, this.normal) >= 0 ? distance : -distance;
    }
}

export const XOY3 = plane3(ZUNIT3, 0);
export const YOZ3 = plane3(XUNIT3, 0);
export const ZOX3 = plane3(YUNIT3, 0);

export function plane3(normal: Vec3, distance: number): Plane3 {
    return new Plane3Impl(normal, distance);
}

export function isPlane3(plane: unknown): plane is Plane3 {
    return !!plane && (isVec3((plane as Plane3).normal) && 'distance' in (plane as Plane3));
}

export function plane3eq(lhs: Plane3, rhs: Plane3, eps: number = FLOAT_EQ_EPS): boolean {
    return lhs === rhs || (floatEq(lhs.distance, rhs.distance, eps) && eq3(lhs.normal, rhs.normal, eps));
}

export function plane3ofPoints(point1: Vec3, point2: Vec3, point3: Vec3): Plane3 {
    const direction1 = sub3(point2, point1);
    const direction2 = sub3(point3, point1);
    const normal = cross3(direction1, direction2);
    if (isZero3(normal)) {
        throw new Error('same points');
    }
    const distance = dot3(norm3(normal), point1);
    return plane3(normal, distance);
}
