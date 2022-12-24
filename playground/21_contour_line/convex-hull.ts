import {
    Vec2, vec2, dot2, dir2,
} from 'lib';

const EPS = 1E-5;

// Finds convex hull of points using "Quickhull" algorithm.
// https://en.wikipedia.org/wiki/Quickhull
export function findConvexHull(points: ReadonlyArray<Vec2>): Vec2[] {
    let minStart = vec2(+Infinity, +Infinity);
    let maxStart = vec2(-Infinity, -Infinity);
    for (const point of points) {
        if ((point.x < minStart.x) || (point.x === minStart.x && point.y < minStart.y)) {
            minStart = point;
        }
        if ((point.x > maxStart.x) || (point.x === maxStart.x && point.y > maxStart.y)) {
            maxStart = point;
        }
    }
    const normal = getNormal(minStart, maxStart);
    const lineDist = getDistance(minStart, normal);
    const list1: Vec2[] = [];
    const list2: Vec2[] = [];
    for (const point of points) {
        const dist = getDistance(point, normal) - lineDist;
        if (dist > +EPS) {
            list1.push(point);
        }
        if (dist < -EPS) {
            list2.push(point);
        }
    }
    const result1 = findConvexHullCore(minStart, maxStart, list1);
    const result2 = findConvexHullCore(maxStart, minStart, list2);
    // Go from leftmost point to points below then to rightmost point then to points above then back.
    // That gives CCW order.
    return [minStart, ...result2, maxStart, ...result1];
}

function getNormal(p1: Vec2, p2: Vec2): Vec2 {
    const dir = dir2(p1, p2);
    return vec2(-dir.y, dir.x);
}

function getDistance(p: Vec2, normal: Vec2): number {
    return dot2(p, normal);
}

function findConvexHullCore(p1: Vec2, p2: Vec2, points: ReadonlyArray<Vec2>): Vec2[] {
    if (points.length === 0) {
        return [];
    }
    const normal = getNormal(p1, p2);
    const lineDist = getDistance(p1, normal);
    let targetPoint!: Vec2;
    let maxDist = 0;
    for (const point of points) {
        const dist = getDistance(point, normal) - lineDist;
        if (dist > maxDist) {
            maxDist = dist;
            targetPoint = point;
        }
    }
    const normal1 = getNormal(p1, targetPoint);
    const lineDist1 = getDistance(targetPoint, normal1);
    const normal2 = getNormal(targetPoint, p2);
    const lineDist2 = getDistance(targetPoint, normal2);
    const list1: Vec2[] = [];
    const list2: Vec2[] = [];
    for (const point of points) {
        const dist1 = getDistance(point, normal1) - lineDist1;
        if (dist1 > EPS) {
            list1.push(point);
        }
        const dist2 = getDistance(point, normal2) - lineDist2;
        if (dist2 > EPS) {
            list2.push(point);
        }
    }
    const result1 = findConvexHullCore(p1, targetPoint, list1);
    const result2 = findConvexHullCore(targetPoint, p2, list2);
    // Take points right-to-left to ensure CCW order.
    return [...result2, targetPoint, ...result1];
}
