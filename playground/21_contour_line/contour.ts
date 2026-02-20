import type { Vec2, Vec3, Mat4 } from 'lib';
import { mul4v3 } from 'lib';
import { findConvexHull } from './convex-hull';

export function findContour(points: ReadonlyArray<Vec3>, viewProjMat: Mat4): Vec2[] {
    const transfomed = points.map((point) => mul4v3(viewProjMat, point));
    return findConvexHull(transfomed);
}
