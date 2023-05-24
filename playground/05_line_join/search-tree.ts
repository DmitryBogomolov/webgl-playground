import type { Vec2 } from 'lib';
import type { State } from './state';
import type { KDTreeAxisFuncList, KDTreeDistanceFunc } from 'lib';
import { KDTree } from 'lib';

export class SearchTree {
    private readonly _axisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];
    private readonly _distFunc: KDTreeDistanceFunc;
    private readonly _state: State;
    private _tree!: KDTree<Vec2>;

    constructor(getSize: () => Vec2, state: State) {
        this._distFunc = ([x, y]) => {
            // screen_x ~ W / 2 * ndc_x, screen_y ~ H / 2 * ndc_y
            const { x: w, y: h } = getSize();
            return (x * w / 2) ** 2 + (y * h / 2) ** 2;
        };
        this._state = state;
        state.verticesChanged.on(this._update);
        state.vertexUpdated.on(this._update);
        this._update();
    }

    private readonly _update = (): void => {
        this._tree = new KDTree(
            this._state.vertices.map((v) => v.position), this._axisFuncList, this._distFunc,
        );
    };

    dispose(): void {
        this._state.verticesChanged.off(this._update);
        this._state.vertexUpdated.off(this._update);
    }

    findNearest(target: Vec2): number {
        return this._tree.findNearest(target)!.index;
    }
}
