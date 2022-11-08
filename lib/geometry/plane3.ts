import type { Plane3 } from './types/plane3';
import type { Vec3 } from './types/vec3';
import { XUNIT3, YUNIT3, ZUNIT3, isVec3, eq3, norm3, neg3 } from './vec3';
import { floatEq, FLOAT_EQ_EPS } from './float-eq';

export class Plane3Impl implements Plane3 {
    readonly normal: Vec3;
    readonly distance: number;

    constructor(normal: Vec3, distance: number) {
        const norm = norm3(normal);
        // Opposite normal defines the same plane. Pick one normal.
        this.normal = norm.x >= 0 ? norm : neg3(norm);
        this.distance = norm.x >= 0 ? distance : -distance;
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
