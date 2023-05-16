import type { Vec2, Vec3, Mat4 } from 'lib';
import { mul4x4, mul4v3 } from 'lib';
import { findConvexHull } from './convex-hull';

export function findContour(points: ReadonlyArray<Vec3>, worldMat: Mat4, viewProjMat: Mat4): Vec2[] {
    const mat = mul4x4(viewProjMat, worldMat);
    const transfomed = points.map((point) => mul4v3(mat, point));
    return findConvexHull(transfomed);
}
