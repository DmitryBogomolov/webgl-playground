import {
    Runtime,
    Color, color,
    Vec2, vec2, dist2, Tracker,
} from 'lib';
import { Vertex } from './vertex';
import { Line } from './line/line';
import { BevelLine } from './line/bevel';
import { RoundLine } from './line/round';
import { SearchTree } from './search-tree';

/**
 * Bevel line join.
 */
export type DESCRIPTION = never;

// TODO: Provide round join.

const container1 = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-1')!;
const container2 = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-2')!;

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

const vertices: Vertex[] = [
    { position: vec2(-0.7, -0.8), color: pickColor() },
    { position: vec2(-0.1, +0.5), color: pickColor() },
    { position: vec2(+0.4, -0.5), color: pickColor() },
    { position: vec2(+0.8, +0.6), color: pickColor() },
];

let thickness = 50;

const runtime1 = new Runtime(container1);
const runtime2 = new Runtime(container2);

interface LineConstructor<T extends Line> {
    new(runtime: Runtime): T;
}

function setupLine<T extends Line>(runtime: Runtime, ctor: LineConstructor<T>): T {
    const line = new ctor(runtime);
    runtime.onRender(() => {
        runtime.clearColorBuffer();
        line.render();
    });
    return line;
}

const line1 = setupLine(runtime1, BevelLine);
const line2 = setupLine(runtime2, RoundLine);

function requestRender(): void {
    runtime1.requestRender();
    runtime2.requestRender();
}

function setThickness(): void {
    line1.setThickness(thickness);
    line2.setThickness(thickness);
    requestRender();
}

function setVertices(): void {
    line1.setVertices(vertices);
    line2.setVertices(vertices);
    requestRender();
}

function updateVertex(idx: number): void {
    line1.updateVertex(vertices, idx);
    line2.updateVertex(vertices, idx);
    requestRender();
}

setThickness();
setVertices();

function ndc2px(ndc: Vec2): Vec2 {
    return runtime1.ndc2px(ndc);
}

function px2ndc(px: Vec2): Vec2 {
    return runtime1.px2ndc(px);
}

const tree = new SearchTree(() => runtime1.canvasSize());
updateTree();

function updateTree(): void {
    tree.update(vertices);
}

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

setupTracker(container1);
setupTracker(container2);

function setupTracker(container: HTMLDivElement): void {
    let motionVertexIdx: number = -1;
    let thicknessVertexIdx: number = -1;

    new Tracker(container, {
        onDblClick({ coords }) {
            const vertexIdx = tree.findNearest(px2ndc(coords))!;
            const vertexCoords = ndc2px(vertices[vertexIdx].position);
            const dist = dist2(vertexCoords, coords);
            if (dist <= VERTEX_THRESHOLD) {
                if (vertices.length <= 2) {
                    return;
                }
                vertices.splice(vertexIdx, 1);
                updateTree();
                setVertices();
            } else {
                vertices.splice(vertices.length, 0, { position: px2ndc(coords), color: pickColor() });
                updateTree();
                setVertices();
            }
        },
        onStart({ coords }) {
            const vertexIdx = tree.findNearest(px2ndc(coords))!;
            const vertexCoords = ndc2px(vertices[vertexIdx].position);
            const dist = dist2(vertexCoords, coords);
            if (dist <= VERTEX_THRESHOLD) {
                motionVertexIdx = vertexIdx;
            } else if (Math.abs(dist - thickness / 2) <= BORDER_THRESHOLD) {
                thicknessVertexIdx = vertexIdx;
            }
        },
        onMove({ coords }) {
            if (motionVertexIdx >= 0) {
                vertices[motionVertexIdx].position = px2ndc({
                    x: clamp(coords.x, 0, container1.clientWidth),
                    y: clamp(coords.y, 0, container1.clientHeight),
                });
                updateTree();
                updateVertex(motionVertexIdx);
            } else if (thicknessVertexIdx >= 0) {
                const dist = dist2(coords, ndc2px(vertices[thicknessVertexIdx].position));
                thickness = dist * 2 | 0;
                setThickness();
            }
        },
        onEnd() {
            motionVertexIdx = -1;
            thicknessVertexIdx = -1;
        },
    });
}

function clamp(value: number, minValue: number, maxValue: number): number {
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}
