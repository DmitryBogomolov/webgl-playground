import type { Vec3 } from './types/vec3';
import type { Line3 } from'./types/line3';
import type { Plane3 } from'./types/plane3';
import { add3, sub3, mul3, norm3, project3, dist3, dot3 } from './vec3';

// Take direction from line point to targer point, project it onto line direction.
// Apply that offset to line point.
export function point3line3projection(point: Vec3, line: Line3): Vec3 {
    const toPointDir = sub3(point, line.anchor);
    const offset = project3(toPointDir, line.direction);
    return add3(line.anchor, offset);
}

export function point3line3distance(point: Vec3, line: Line3): number {
    const projection = point3line3projection(point, line);
    return dist3(projection, point);
}

// Take point on plane. Project direction from target point to plane point onto plane normal.
// Apply that offset to target point.
export function point3plane3projection(point: Vec3, plane: Plane3): Vec3 {
    const planePoint = mul3(norm3(plane.normal), plane.distance);
    const offset = project3(sub3(planePoint, point), plane.normal);
    return add3(point, offset);
}

export function point3plane3distance(point: Vec3, plane: Plane3): number {
    const projection = point3plane3projection(point, plane);
    return dist3(projection, point);
}

// Line is defined as v = anchor + direction * t. Plane is defined as (normal, v) = distance.
// Substitution of v gives (anchor, normal) + (direction, normal) * t = distance
// and then t = (distance - (anchor, normal)) / (direction, normal).
// Returns intersection point or (if line is parallel to plane) distance between line and plane.
export function line3plane3intersection(line: Line3, plane: Plane3): Vec3 | number {
    const normal = norm3(plane.normal);
    const num = plane.distance - dot3(line.anchor, normal);
    const den = dot3(line.direction, normal);
    const t = num / den;
    if (Number.isFinite(t)) {
        return add3(mul3(line.direction, t), line.anchor);
    }
    if (num === 0) {
        return 0;
    }
    return point3plane3distance(line.anchor, plane);
}

export function line3line3intersection(line1: Line3, line2: Line3): Vec3 | null {
    // TODO...
    return null;
}

export function plane3plane3intersection(plane1: Plane3, plane2: Plane3): Line3 | null {
    // TODO...
    return null;
}
