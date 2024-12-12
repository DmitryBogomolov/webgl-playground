import type { Vec2 } from 'lib';
import { vec2, clone2, EventEmitter } from 'lib';

export class State {
    readonly verticesChanged = new EventEmitter();
    readonly vertexUpdated = new EventEmitter<[number]>();
    readonly thicknessChanged = new EventEmitter();
    vertices: Vec2[] = [
        vec2(-0.7, -0.8),
        vec2(-0.1, +0.5),
        vec2(+0.4, -0.5),
        vec2(+0.8, +0.6),
    ];
    thickness: number = 50;

    dispose(): void {
        this.verticesChanged.clear();
        this.vertexUpdated.clear();
        this.thicknessChanged.clear();
    }

    addVertex(idx: number, position: Vec2): void {
        this.vertices.splice(idx, 0, clone2(position));
        this.verticesChanged.emit();
    }

    removeVertex(idx: number): void {
        this.vertices.splice(idx, 1);
        this.verticesChanged.emit();
    }

    updateVertex(idx: number, position: Vec2): void {
        this.vertices[idx] = clone2(position);
        this.vertexUpdated.emit(idx);
    }

    setThickness(value: number): void {
        this.thickness = value;
        this.thicknessChanged.emit();
    }
}
