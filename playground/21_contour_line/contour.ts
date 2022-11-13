import {
    Vec2,
    Vec3,
    Mat4, mul4x4, mul4v3,
} from 'lib';
import { findConvexHull } from './convex-hull';

export function findContour(points: ReadonlyArray<Vec3>, worldMat: Mat4, viewProjMat: Mat4): Vec2[] {
    const mat = mul4x4(viewProjMat, worldMat);
    const transfomed = points.map((point) => mul4v3(mat, point) as Vec2);
    const hull = findConvexHull(transfomed);
    // Make CCW order.
    hull.reverse();
    return hull;
}
