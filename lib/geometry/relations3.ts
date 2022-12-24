import type { Vec3 } from './types/vec3';
import type { Line3 } from './types/line3';
import type { Plane3 } from './types/plane3';
import { vec3, add3, sub3, mul3, norm3, project3, dist3, dot3, cross3, len3, isZero3 } from './vec3';
import { line3 } from './line3';
import { solveSysLinEq } from './sys-lin-eq';

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

export function line3line3intersection(line1: Line3, line2: Line3): Vec3 | null {
    const xy = solveSysLinEq(
        [line1.direction.x, -line2.direction.x, line1.direction.y, -line2.direction.y],
        [-line1.anchor.x + line2.anchor.x, -line1.anchor.y + line2.anchor.y],
    );
    const yz = solveSysLinEq(
        [line1.direction.y, -line2.direction.y, line1.direction.z, -line2.direction.z],
        [-line1.anchor.y + line2.anchor.y, -line1.anchor.z + line2.anchor.z],
    );
    if (xy === null || yz === null) {
        return null;
    }
    if (xy === undefined && yz === undefined) {
        return null;
    }
    const t = (xy && xy[0]) || (yz && yz[0]) as number;
    return add3(line1.anchor, mul3(line1.direction, t));
}

export function plane3plane3intersection(plane1: Plane3, plane2: Plane3): Line3 | number {
    const normal1 = norm3(plane1.normal);
    const normal2 = norm3(plane2.normal);
    const direction = cross3(normal1, normal2);
    if (isZero3(direction)) {
        return Math.abs(plane1.distance - plane2.distance);
    }

    // Line anchor point belongs to both lines.
    // (normal1, anchor) = distance1 and (normal2, anchor) = distance2.
    // It gives two equations and three unknowns (intersection line itself).
    // That lines intersects at least one of XOY, YOZ, ZOY planes. Pick any point.
    let anchor: Vec3 | null = null;
    if (anchor === null) {
        const ret = solveSysLinEq([normal1.x, normal1.y, normal2.x, normal2.y], [plane1.distance, plane2.distance]);
        if (ret) {
            anchor = vec3(ret[0], ret[1], 0);
        }
    }
    if (anchor === null) {
        const ret = solveSysLinEq([normal1.y, normal1.z, normal2.y, normal2.z], [plane1.distance, plane2.distance]);
        if (ret) {
            anchor = vec3(0, ret[0], ret[1]);
        }
    }
    if (anchor === null) {
        const ret = solveSysLinEq([normal1.x, normal1.z, normal2.x, normal2.z], [plane1.distance, plane2.distance]);
        if (ret) {
            anchor = vec3(ret[0], 0, ret[1]);
        }
    }
    return line3(direction, anchor!);
}
