import type { Line3 } from './types/line3';
import type { Vec3 } from './types/vec3';
import { ZERO3, XUNIT3, YUNIT3, ZUNIT3, isVec3, eq3, norm3, neg3, project3, sub3 } from './vec3';
import { FLOAT_EQ_EPS } from './float-eq';

export class Line3Impl implements Line3 {
    readonly direction: Vec3;
    readonly anchor: Vec3;

    constructor(direction: Vec3, anchor: Vec3) {
        const dir = norm3(direction);
        // Opposite direction defines the same line. Pick one direction.
        this.direction = dir.x >= 0 ? dir : neg3(dir);
        // Pick point on the line closest to (0,0,0). That would be projection onto the line.
        this.anchor = sub3(anchor, project3(anchor, this.direction));
    }
}

export const OX3 = line3(XUNIT3, ZERO3);
export const OY3 = line3(YUNIT3, ZERO3);
export const OZ3 = line3(ZUNIT3, ZERO3);

export function line3(direction: Vec3, anchor: Vec3): Line3 {
    return new Line3Impl(direction, anchor);
}

export function isLine3(line: unknown): line is Line3 {
    return !!line && (isVec3((line as Line3).direction) && isVec3((line as Line3).anchor));
}

export function line3eq(lhs: Line3, rhs: Line3, eps: number = FLOAT_EQ_EPS): boolean {
    return lhs === rhs || (eq3(lhs.direction, rhs.direction, eps) && eq3(lhs.anchor, rhs.anchor, eps));
}