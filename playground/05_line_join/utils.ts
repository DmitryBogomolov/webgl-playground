import { Vec2, sub2, dot2, pointToLineDistance2, KDTree, KDTreeAxisFuncList, KDTreeDistanceFunc } from 'lib';
import { Vertex } from './vertex';

export type Ndc2PxFunc = (ndc: Vec2) => Vec2;

export type SearchTree = KDTree<Vec2>;

const getPosition = (vertex: Vertex): Vec2 => vertex.position;

const searchTreeAxisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];

const searchTreeDistance: KDTreeDistanceFunc = ([x, y]) => x * x + y * y;

export function makeSearchTree(vertices: ReadonlyArray<Vertex>): SearchTree {
    return new KDTree<Vec2>(vertices.map(getPosition), searchTreeAxisFuncList, searchTreeDistance);
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
