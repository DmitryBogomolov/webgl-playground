import type { Vec3 } from './types/vec3';
import type { Line3 } from './types/line3';
import type { Plane3 } from './types/plane3';
import { add3, sub3, mul3, norm3, project3, dist3, dot3, cross3, len3, isZero3 } from './vec3';
import { line3 } from './line3';

export function point3line3projection(point: Vec3, line: Line3): Vec3 {
    // Take direction from line point to targer point, project it onto line direction.
    // Apply that offset to line point.
    const toPointDir = sub3(point, line.anchor);
    const offset = project3(toPointDir, line.direction);
    return add3(line.anchor, offset);
}

export function point3line3distance(point: Vec3, line: Line3): number {
    const projection = point3line3projection(point, line);
    return dist3(projection, point);
}

export function point3plane3projection(point: Vec3, plane: Plane3): Vec3 {
    // Take point on plane. Project direction from target point to plane point onto plane normal.
    // Apply that offset to target point.
    const planePoint = mul3(norm3(plane.normal), plane.distance);
    const offset = project3(sub3(planePoint, point), plane.normal);
    return add3(point, offset);
}

export function point3plane3distance(point: Vec3, plane: Plane3): number {
    const projection = point3plane3projection(point, plane);
    return dist3(projection, point);
}

export function line3plane3intersection(line: Line3, plane: Plane3): Vec3 | number {
    // Line is defined as v = anchor + direction * t. Plane is defined as (normal, v) = distance.
    // Substitution of v gives (anchor, normal) + (direction, normal) * t = distance
    // and then t = (distance - (anchor, normal)) / (direction, normal).
    const normal = norm3(plane.normal);
    const num = plane.distance - dot3(line.anchor, normal);
    const den = dot3(line.direction, normal);
    const t = num / den;
    // Return intersection point.
    if (Number.isFinite(t)) {
        return add3(mul3(line.direction, t), line.anchor);
    }
    // Lines are same, distance is 0.
    if (num === 0) {
        return 0;
    }
    return point3plane3distance(line.anchor, plane);
}

export function line3line3distance(line1: Line3, line2: Line3): number {
    const norm = cross3(line1.direction, line2.direction);
    // Volume of parallelepiped with direction1, direction2, (anchor1 - anchor2) sides.
    const num = Math.abs(dot3(sub3(line1.anchor, line2.anchor), norm));
    // Area of parallelepiped base with direction1, direction2 sides.
    const den = len3(norm);
    const h = num / den;
    // Parallelepiped height.
    if (Number.isFinite(h)) {
        return h;
    }
    // Lines are collinear.
    return point3line3distance(line1.anchor, line2);
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

export function line3line3intersection(line1: Line3, line2: Line3): Vec3 | null {
    const xy = lin(
        line1.direction.x, -line2.direction.x, line1.direction.y, -line2.direction.y,
        -line1.anchor.x + line2.anchor.x, -line1.anchor.y + line2.anchor.y,
    );
    const yz = lin(
        line1.direction.y, -line2.direction.y, line1.direction.z, -line2.direction.z,
        -line1.anchor.y + line2.anchor.y, -line1.anchor.z + line2.anchor.z,
    );
    if (xy.type === 'none' || yz.type === 'none') {
        return null;
    }
    if (xy.type === 'many' && yz.type === 'many') {
        return null;
    }
    const t = (xy.type === 'one' && xy.t1) || (yz.type === 'one' && yz.t2) as number;
    return add3(line1.anchor, mul3(line1.direction, t));
}

export function plane3plane3intersection(plane1: Plane3, plane2: Plane3): Line3 | number {
    const normal1 = norm3(plane1.normal);
    const normal2 = norm3(plane2.normal);
    const direction = cross3(normal1, normal2);
    if (isZero3(direction)) {
        return Math.abs(plane1.distance - plane2.distance);
    }
    // Line is defined as anchor + direction * t. Substitute it into planes.
    // (normal1, anchor + direction * t) = distance1, (normal2, anchor + direction * t) = distance2
    // After simplification
    // ((normal1, direction) * normal2 - (normal2, direction) * normal1, anchor) =
    // = (normal1, direction) * distance2 - (normal2, direction) * distance1.
    const dot1 = dot3(normal1, direction);
    const dot2 = dot3(normal2, direction);
    const vec = add3(mul3(normal2, +dot1), mul3(normal1, -dot2));
    const d = dot1 * plane2.distance - dot2 * plane1.distance;
    const anchor = mul3(norm3(vec), d / len3(vec));
    return line3(direction, anchor);
}
