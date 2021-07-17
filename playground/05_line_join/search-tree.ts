import {
    Vec2,
    KDTree, KDTreeAxisFuncList, KDTreeDistanceFunc,
    CancelSubscriptionCallback,
} from 'lib';
import { State } from './state';

export class SearchTree {
    private readonly _axisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];
    private readonly _distFunc: KDTreeDistanceFunc;
    private readonly _cancelVerticesChanged: CancelSubscriptionCallback;
    private readonly _cancelVertexUpdated: CancelSubscriptionCallback;
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
        this._cancelVerticesChanged = state.verticesChanged.on(update);
        this._cancelVertexUpdated = state.vertexUpdated.on(update);
        update();
    }

    dispose(): void {
        this._cancelVerticesChanged();
        this._cancelVertexUpdated();
    }

    findNearest(target: Vec2): number {
        return this._tree.findNearest(target)!.index;
    }
}
