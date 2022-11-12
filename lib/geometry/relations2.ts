import type { Vec2 } from './types/vec2';
import type { Line2 } from './types/line2';
import { vec2, add2, mul2, norm2, dot2 } from './vec2';

export function point2line2projection(point: Vec2, line: Line2): Vec2 {
    const dist = point2line2distance(point, line);
    const offset = mul2(norm2(line.normal), -dist);
    return add2(point, offset);
}

export function point2line2distance(point: Vec2, line: Line2): number {
    // Distance to point minus distance to line.
    return dot2(point, norm2(line.normal)) - line.distance;
}

function lin(
    a11: number, a12: number, a21: number, a22: number, b1: number, b2: number,
): { type: 'one', t1: number, t2: number } | { type: 'many' } | { type: 'none' } {
    const det = a11 * a22 - a21 * a12;
    const det1 = b1 * a22 - b2 * a12;
    const det2 = a11 * b2 - a21 * b2;
    const t1 = det1 / det;
    const t2 = det2 / det;
    if (Number.isFinite(t1) && Number.isFinite(t2)) {
        return { type: 'one', t1, t2 };
    }
    return det1 === 0 && det2 === 0 ? { type: 'many' } : { type: 'none' };
}

export function line2line2intersection(line1: Line2, line2: Line2): Vec2 | null {
    const normal1 = norm2(line1.normal);
    const normal2 = norm2(line2.normal);
    const ret = lin(normal1.x, normal1.y, normal2.x, normal2.y, line1.distance, line2.distance);
    if (ret.type === 'one') {
        return vec2(ret.t1, ret.t2);
    }
    return null;
}
