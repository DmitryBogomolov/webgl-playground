import { Runtime, Vec2, KDTree } from 'lib';
import { Vertex } from './vertex';

export type Ndc2PxFunc = (ndc: Vec2) => Vec2;

export type SearchTree = KDTree<Vec2>;

export function makeSearchTree(vertices: ReadonlyArray<Vertex>, runtime: Runtime): SearchTree {
    return new KDTree<Vec2>(
        vertices.map((v) => v.position),
        [(v) => v.x, (v) => v.y],
        ([x, y]) => {
            // screen_x ~ W / 2 * ndc_x, screen_y ~ H / 2 * ndc_y
            const { x: w, y: h } = runtime.canvasSize();
            return (x * w / 2) ** 2 + (y * h / 2) ** 2;
        },
    );
}
