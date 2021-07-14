import { Vec2, KDTree, KDTreeAxisFuncList, KDTreeDistanceFunc } from 'lib';
import { State } from './state';

export class SearchTree {
    private readonly _axisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];
    private readonly _distFunc: KDTreeDistanceFunc;
    private _tree!: KDTree<Vec2>;

    constructor(getSize: () => Vec2, state: State) {
        this._distFunc = ([x, y]) => {
            // screen_x ~ W / 2 * ndc_x, screen_y ~ H / 2 * ndc_y
            const { x: w, y: h } = getSize();
            return (x * w / 2) ** 2 + (y * h / 2) ** 2;
        };

        const update = (): void => {
            this._tree = new KDTree(state.vertices.map((v) => v.position), this._axisFuncList, this._distFunc);
        };

        update();
        state.verticesChanged.on(update);
        state.vertexUpdated.on(update);
    }

    findNearest(target: Vec2): number {
        return this._tree.findNearest(target)!.index;
    }
}
