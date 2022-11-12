import type { Line2 } from './types/line2';
import type { Vec2 } from './types/vec2';
import { ZERO2, XUNIT2, YUNIT2, isVec2, eq2, project2, sub2, isZero2 } from './vec2';
import { FLOAT_EQ_EPS } from './float-eq';
import { normalizeDirection2 } from './dir-norm2';

export class Line2Impl implements Line2 {
    readonly direction: Vec2;
    readonly anchor: Vec2;

    constructor(direction: Vec2, anchor: Vec2) {
        this.direction = normalizeDirection2(direction);
        // Pick point on the line closest to (0,0). That would be projection onto the line.
        this.anchor = sub2(anchor, project2(anchor, this.direction));
    }
}

export const OX2 = line2(XUNIT2, ZERO2);
export const OY2 = line2(YUNIT2, ZERO2);

export function line2(direction: Vec2, anchor: Vec2): Line2 {
    return new Line2Impl(direction, anchor);
}

export function isLine2(line: unknown): line is Line2 {
    return !!line && (isVec2((line as Line2).direction) && isVec2((line as Line2).anchor));
}

export function line2eq(lhs: Line2, rhs: Line2, eps: number = FLOAT_EQ_EPS): boolean {
    return lhs === rhs || (eq2(lhs.direction, rhs.direction, eps) && eq2(lhs.anchor, rhs.anchor, eps));
}

export function line2ofPoints(point1: Vec2, point2: Vec2): Line2 {
    const direction = sub2(point2, point1);
    if (isZero2(direction)) {
        throw new Error('same points');
    }
    return line2(direction, point1);
}
