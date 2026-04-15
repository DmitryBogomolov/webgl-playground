import type { Vec2 } from 'lib';
import { vec2, clone2 } from 'lib';
import { observable } from 'playground-utils/observable';

export class State {
    private readonly _points: Vec2[] = [
        vec2(-0.7, -0.8),
        vec2(-0.1, +0.5),
        vec2(+0.4, -0.5),
        vec2(+0.8, +0.6),
    ];

    readonly changedPoints = observable({ count: -1 });
    readonly updatedPoint = observable({ index: -1 });
    readonly thickness = observable(50);

    get points(): ReadonlyArray<Vec2> {
        return this._points;
    }

    addPoint(idx: number, position: Vec2): void {
        this._points.splice(idx, 0, clone2(position));
        this.changedPoints({ count: this._points.length });
    }

    removePoin(idx: number): void {
        this._points.splice(idx, 1);
        this.changedPoints({ count: this._points.length });
    }

    updatePoint(idx: number, position: Vec2): void {
        this._points[idx] = clone2(position);
        this.updatedPoint({ index: idx });
    }
}
