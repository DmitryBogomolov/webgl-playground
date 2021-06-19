import { Vec2, Color, sqrdist2, sub2, dot2, pointToLineDistance2 } from 'lib';

export interface Vertex {
    position: Vec2;
    readonly color: Color;
}

export type Ndc2PxFunc = (ndc: Vec2) => Vec2;

export function findNearestVertex(vertices: ReadonlyArray<Vertex>, target: Vec2, ndc2px: Ndc2PxFunc): number {
    let index = -1;
    let distance = Number.MAX_VALUE;
    for (let i = 0; i < vertices.length; ++i) {
        const dist = sqrdist2(ndc2px(vertices[i].position), target);
        if (dist < distance) {
            distance = dist;
            index = i;
        }
    }
    return index;
}

function checkOtherVertex(
    vertices: ReadonlyArray<Vertex>, target: Vec2, point: Vec2, otherIdx: number, ndc2px: Ndc2PxFunc,
): Vec2 | null {
    const other = vertices[otherIdx] ? ndc2px(vertices[otherIdx].position) : null;
    if (!other) {
        return null;
    }
    const toTarget = sub2(target, point);
    const toOther = sub2(other, point);
    const t = dot2(toTarget, toOther) / dot2(toOther, toOther);
    return 0 <= t && t <= 1 ? other : null;
}

export function pickOtherVertex(
    vertices: ReadonlyArray<Vertex>, target: Vec2, vertexIdx: number, ndc2px: Ndc2PxFunc,
): number {
    const point = ndc2px(vertices[vertexIdx].position);
    const left = checkOtherVertex(vertices, target, point, vertexIdx - 1, ndc2px);
    const right = checkOtherVertex(vertices, target, point, vertexIdx + 1, ndc2px);
    if (left && right) {
        const leftDist = pointToLineDistance2(target, point, left);
        const rightDist = pointToLineDistance2(target, point, right);
        return leftDist <= rightDist ? vertexIdx - 1 : vertexIdx + 1;
    }
    if (left) {
        return vertexIdx - 1;
    }
    if (right) {
        return vertexIdx + 1;
    }
    return -1;
}
