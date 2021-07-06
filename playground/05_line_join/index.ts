import {
    Runtime,
    Color, color,
    Vec2, vec2, dist2, Tracker,
} from 'lib';
import { Vertex } from './vertex';
// import { BevelLine } from './bevel-line';
import { RoundLine } from './round-line';
import { SearchTree, makeSearchTree } from './utils';

/**
 * Bevel line join.
 */
export type DESCRIPTION = never;

// TODO: Provide round join.

const container = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT)!;

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

let thickness = 0;

function setThickness(value: number): void {
    thickness = value;
    line.setThickness(thickness);
}

const runtime = new Runtime(container);
const line = new RoundLine(runtime);
line.setVertices(vertices);
runtime.onRender(() => {
    runtime.clearColorBuffer();
    line.render();
});

setThickness(50);

function ndc2px(ndc: Vec2): Vec2 {
    return runtime.ndc2px(ndc);
}

function px2ndc(px: Vec2): Vec2 {
    return runtime.px2ndc(px);
}

let motionVertexIdx: number = -1;
let thicknessVertexIdx: number = -1;

let tree: SearchTree;
updateTree();

function updateTree(): void {
    tree = makeSearchTree(vertices, runtime);
}

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

new Tracker(container, {
    onDblClick({ coords }) {
        const { index: vertexIdx } = tree.findNearest(px2ndc(coords))!;
        const vertexCoords = ndc2px(vertices[vertexIdx].position);
        const dist = dist2(vertexCoords, coords);
        if (dist <= VERTEX_THRESHOLD) {
            if (vertices.length <= 2) {
                return;
            }
            vertices.splice(vertexIdx, 1);
            updateTree();
            line.setVertices(vertices);
            runtime.requestRender();
        } else {
            vertices.splice(vertices.length, 0, { position: px2ndc(coords), color: pickColor() });
            updateTree();
            line.setVertices(vertices);
            runtime.requestRender();
        }
    },
    onStart({ coords }) {
        const { index: vertexIdx } = tree.findNearest(px2ndc(coords))!;
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
                x: clamp(coords.x, 0, container.clientWidth),
                y: clamp(coords.y, 0, container.clientHeight),
            });
            updateTree();
            line.updateVertex(vertices, motionVertexIdx);
            runtime.requestRender();
        } else if (thicknessVertexIdx >= 0) {
            const dist = dist2(coords, ndc2px(vertices[thicknessVertexIdx].position));
            setThickness(dist * 2 | 0);
            runtime.requestRender();
        }
    },
    onEnd() {
        motionVertexIdx = -1;
        thicknessVertexIdx = -1;
    },
});

function clamp(value: number, minValue: number, maxValue: number): number {
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}
