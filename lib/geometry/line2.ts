import type { Line2 } from './types/line2';
import type { Vec2 } from './types/vec2';
import { XUNIT2, YUNIT2, isVec2, eq2, dot2, sub2, norm2, vec2 } from './vec2';
import { floatEq, FLOAT_EQ_EPS } from './float-eq';
import { normalizeDirection2 } from './dir-norm2';

export class Line2Impl implements Line2 {
    readonly normal: Vec2;
    readonly distance: number;

    constructor(normal: Vec2, distance: number) {
        this.normal = normalizeDirection2(normal);
        this.distance = dot2(normal, this.normal) >= 0 ? distance : -distance;
    }
}

export const OX2 = line2(XUNIT2, 0);
export const OY2 = line2(YUNIT2, 0);

export function line2(direction: Vec2, distance: number): Line2 {
    return new Line2Impl(direction, distance);
}

export function isLine2(line: unknown): line is Line2 {
    return !!line && (isVec2((line as Line2).normal) && 'distance' in (line as Line2));
}

export function line2eq(lhs: Line2, rhs: Line2, eps: number = FLOAT_EQ_EPS): boolean {
    return lhs === rhs || (eq2(lhs.normal, rhs.normal, eps) && floatEq(lhs.distance, rhs.distance, eps));
}

export function line2ofPoints(point1: Vec2, point2: Vec2): Line2 {
    if (eq2(point1, point2)) {
        throw new Error('same points');
    }
    const direction = norm2(sub2(point2, point1));
    const normal = vec2(-direction.y, direction.x);
    return line2(normal, dot2(norm2(normal), point1));
}
