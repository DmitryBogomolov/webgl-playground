import {
    Color, color,
    Vec2, vec2,
    EventEmitter,
} from 'lib';
import { Vertex } from './vertex';

const pickColor = (function () {
    const colorPool: ReadonlyArray<Color> = [
        color(0, 0, 1),
        color(0, 1, 0),
        color(0, 1, 1),
        color(1, 0, 0),
        color(1, 0, 1),
        color(1, 1, 0),
    ];
    let next = 0;

    function pick(): Color {
        const idx = next;
        next = (next + 1) % colorPool.length;
        return colorPool[idx];
    }

    return pick;
}());

export class State {
    readonly verticesChanged = new EventEmitter();
    readonly vertexUpdated = new EventEmitter<[number]>();
    readonly thicknessChanged = new EventEmitter();
    vertices: Vertex[] = [
        { position: vec2(-0.7, -0.8), color: pickColor() },
        { position: vec2(-0.1, +0.5), color: pickColor() },
        { position: vec2(+0.4, -0.5), color: pickColor() },
        { position: vec2(+0.8, +0.6), color: pickColor() },
    ];
    thickness: number = 50;

    dispose(): void {
        this.verticesChanged.clear();
        this.vertexUpdated.clear();
        this.thicknessChanged.clear();
    }

    addVertex(idx: number, position: Vec2): void {
        this.vertices.splice(idx, 0, { position, color: pickColor() });
        this.verticesChanged.emit();
    }

    removeVertex(idx: number): void {
        this.vertices.splice(idx, 1);
        this.verticesChanged.emit();
    }

    updateVertex(idx: number, position: Vec2): void {
        this.vertices[idx].position = position;
        this.vertexUpdated.emit(idx);
    }

    setThickness(value: number): void {
        this.thickness = value;
        this.thicknessChanged.emit();
    }
}
