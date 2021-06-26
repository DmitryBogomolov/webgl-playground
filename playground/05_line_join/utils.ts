import { Vec2, KDTree, KDTreeAxisFuncList, KDTreeDistanceFunc } from 'lib';
import { Vertex } from './vertex';

export type Ndc2PxFunc = (ndc: Vec2) => Vec2;

export type SearchTree = KDTree<Vec2>;

const getPosition = (vertex: Vertex): Vec2 => vertex.position;

const searchTreeAxisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];

const searchTreeDistance: KDTreeDistanceFunc = ([x, y]) => x * x + y * y;

export function makeSearchTree(vertices: ReadonlyArray<Vertex>): SearchTree {
    return new KDTree<Vec2>(vertices.map(getPosition), searchTreeAxisFuncList, searchTreeDistance);
}
