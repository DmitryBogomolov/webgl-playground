import type { Vec2 } from 'lib';
import { vec2, clone2 } from 'lib';
import { observable } from 'playground-utils/observable';

export class State {
    private _vertices = getInitialVertices();
    readonly changedVertices = observable({ count: -1 });
    readonly changedVertex = observable({ index: -1 });
    readonly thickness = observable(50);

    dispose(): void {
        this.changedVertices.dispose();
        this.changedVertex.dispose();
        this.thickness.dispose();
    }

    vertices(): ReadonlyArray<Vec2> {
        return this._vertices;
    }

    addVertex(idx: number, position: Vec2): void {
        this._vertices.splice(idx, 0, clone2(position));
        this.changedVertices({ count: this._vertices.length });
    }

    removeVertex(idx: number): void {
        this._vertices.splice(idx, 1);
        this.changedVertices({ count: this._vertices.length });
    }

    updateVertex(idx: number, position: Vec2): void {
        this._vertices[idx] = clone2(position);
        this.changedVertex({ index: idx });
    }
}

function getInitialVertices(): Vec2[] {
    return [
        vec2(-0.7, -0.8),
        vec2(-0.1, +0.5),
        vec2(+0.4, -0.5),
        vec2(+0.8, +0.6),
    ];
}
