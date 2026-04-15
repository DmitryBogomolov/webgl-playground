import type { Runtime, Vec2, KDTreeAxisFuncList } from 'lib';
import type { State } from './state';
import { KDTree, ndc2px } from 'lib';

export class SearchTree {
    private readonly _runtime: Runtime;
    private readonly _state: State;
    private _tree!: KDTree<Vec2>;

    constructor(runtime: Runtime, state: State) {
        this._runtime = runtime;
        this._state = state;
        this._runtime.renderSizeChanged.on(this._update);
        this._state.changedPoints.on(this._update);
        this._state.updatedPoint.on(this._update);
        this._update();
    }

    dispose(): void {
        this._runtime.renderSizeChanged.off(this._update);
        this._state.changedPoints.off(this._update);
        this._state.updatedPoint.off(this._update);
    }

    private readonly _update = (): void => {
        const { clientWidth, clientHeight } = this._runtime.canvas;
        const size: Vec2 = { x: clientWidth, y: clientHeight };
        const points = this._state.points.map((v) => ndc2px(v, size));
        this._tree = new KDTree(points, axisFuncList);
    };

    findNearest(target: Vec2): number {
        return this._tree.findNearest(target)!.index;
    }
}

const axisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];
