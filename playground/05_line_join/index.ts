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
 * Line join.
 *
 * Shows "bevel" and "round" join types.
 * Bevel join is accomplished with vertex shader only but requires quite complex code.
 * Round join is accomplished by both vertex and fragment shaders. Code is simpler but fragment overhead exist.
 */
export type DESCRIPTION = never;

const containerBevel = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-bevel')!;
const containerRound = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT + '-round')!;

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

const runtimeBevel = new Runtime(containerBevel);
const runtimeRound = new Runtime(containerRound);

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

const lineBevel = setupLine(runtimeBevel, BevelLine);
const lineRound = setupLine(runtimeRound, RoundLine);

function requestRender(): void {
    runtimeBevel.requestRender();
    runtimeRound.requestRender();
}

function setThickness(): void {
    lineBevel.setThickness(thickness);
    lineRound.setThickness(thickness);
    requestRender();
}

function setVertices(): void {
    lineBevel.setVertices(vertices);
    lineRound.setVertices(vertices);
    requestRender();
}

function updateVertex(idx: number): void {
    lineBevel.updateVertex(vertices, idx);
    lineRound.updateVertex(vertices, idx);
    requestRender();
}

setThickness();
setVertices();

function ndc2px(ndc: Vec2): Vec2 {
    return runtimeBevel.ndc2px(ndc);
}

function px2ndc(px: Vec2): Vec2 {
    return runtimeBevel.px2ndc(px);
}

const tree = new SearchTree(() => runtimeBevel.size());
updateTree();

function updateTree(): void {
    tree.update(vertices);
}

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

setupTracker(runtimeBevel.canvas());
setupTracker(runtimeRound.canvas());

function setupTracker(container: HTMLElement): void {
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
                    x: clamp(coords.x, 0, containerBevel.clientWidth),
                    y: clamp(coords.y, 0, containerBevel.clientHeight),
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
