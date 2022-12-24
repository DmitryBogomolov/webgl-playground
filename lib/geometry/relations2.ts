import type { Vec2 } from './types/vec2';
import type { Line2 } from './types/line2';
import { vec2, add2, mul2, norm2, dot2 } from './vec2';
import { solveSysLinEq } from './sys-lin-eq';

export function point2line2projection(point: Vec2, line: Line2): Vec2 {
    const dist = point2line2distance(point, line);
    const offset = mul2(norm2(line.normal), -dist);
    return add2(point, offset);
}

export function point2line2distance(point: Vec2, line: Line2): number {
    // Distance to point minus distance to line.
    return dot2(point, norm2(line.normal)) - line.distance;
}

export function line2line2intersection(line1: Line2, line2: Line2): Vec2 | null {
    const normal1 = norm2(line1.normal);
    const normal2 = norm2(line2.normal);
    const ret = solveSysLinEq([normal1.x, normal1.y, normal2.x, normal2.y], [line1.distance, line2.distance]);
    if (ret) {
        return vec2(ret[0], ret[1]);
    }
    return null;
}
