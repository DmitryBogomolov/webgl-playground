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
        this._runtime.sizeChanged().on(this._update);
        state.verticesChanged.on(this._update);
        state.vertexUpdated.on(this._update);
        this._update();
    }

    dispose(): void {
        this._runtime.sizeChanged().off(this._update);
        this._state.verticesChanged.off(this._update);
        this._state.vertexUpdated.off(this._update);
    }

    private readonly _update = (): void => {
        const size = this._runtime.size();
        const vertices = this._state.vertices.map((v) => ndc2px(v, size));
        this._tree = new KDTree(vertices, axisFuncList);
    };

    findNearest(target: Vec2): number {
        return this._tree.findNearest(target)!.index;
    }
}

const axisFuncList: KDTreeAxisFuncList<Vec2> = [(v) => v.x, (v) => v.y];
