import type { Vec3 } from './types/vec3';
import type { Line3 } from'./types/line3';
import type { Plane3 } from'./types/plane3';
import { add3, sub3, mul3, norm3, project3, dist3 } from './vec3';

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

export function line3plane3intersection(line: Line3, plane: Plane3): Vec3 | null {
    // TODO...
    return null;
}

export function line3line3intersection(line1: Line3, line2: Line3): Vec3 | null {
    // TODO...
    return null;
}

export function plane3plane3intersection(plane1: Plane3, plane2: Plane3): Line3 | null {
    // TODO...
    return null;
}
