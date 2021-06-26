import {
    Runtime,
    Color, color,
    makeEventCoordsGetter,
    Vec2, vec2, dist2, pointToLineDistance2,
} from 'lib';
import { Vertex } from './vertex';
import { Line } from './line';
import { SearchTree, makeSearchTree, pickOtherVertex } from './utils';

/**
 * Bevel line join.
 */
export type DESCRIPTION = never;

// TODO: Provide round join.
// TODO: Do not store vertices in Line.

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
const line = new Line(runtime);
for (const vertex of vertices) {
    line.addVertex(line.length(), vertex);
}
runtime.onRender(() => {
    runtime.clearColorBuffer();
    line.render();
});

setThickness(50);

container.addEventListener('pointerdown', handleDown);

const getEventCoord = makeEventCoordsGetter(container);

function ndc2px(ndc: Vec2): Vec2 {
    return runtime.ndc2px(ndc);
}

function px2ndc(px: Vec2): Vec2 {
    return runtime.px2ndc(px);
}

let targetVertexIdx: number = -1;
let targetSegmentIdx: number = -1;

let tree: SearchTree;
updateTree();

function updateTree(): void {
    tree = makeSearchTree(vertices);
}

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

container.addEventListener('dblclick', (e: MouseEvent) => {
    e.preventDefault();

    const coords = getEventCoord(e);
    const { index: vertexIdx } = tree.findNearest(px2ndc(coords))!;
    const vertexCoords = ndc2px(vertices[vertexIdx].position);
    const dist = dist2(vertexCoords, coords);
    if (dist <= VERTEX_THRESHOLD) {
        if (vertices.length <= 2) {
            return;
        }
        line.removeVertex(vertexIdx);
        vertices.splice(vertexIdx, 1);
        updateTree();
        runtime.requestRender();
    } else {
        const vertex: Vertex = { position: px2ndc(coords), color: pickColor() };
        line.addVertex(line.length(), vertex);
        vertices.splice(vertices.length, 0, vertex);
        updateTree();
        runtime.requestRender();
    }
});

function handleDown(e: PointerEvent): void {
    e.preventDefault();
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);

    const coords = getEventCoord(e);
    const { index: vertexIdx } = tree.findNearest(px2ndc(coords))!;
    const vertexCoords = ndc2px(vertices[vertexIdx].position);
    const dist = dist2(vertexCoords, coords);
    if (dist <= VERTEX_THRESHOLD) {
        targetVertexIdx = vertexIdx;
    } else {
        const otherIdx = pickOtherVertex(vertices, coords, vertexIdx, ndc2px);
        if (otherIdx >= 0) {
            const otherCoords = ndc2px(vertices[otherIdx].position);
            const dist = pointToLineDistance2(coords, vertexCoords, otherCoords);
            if (Math.abs(dist - thickness / 2) <= BORDER_THRESHOLD) {
                targetSegmentIdx = Math.min(vertexIdx, otherIdx);
            }
        }
    }
}

function clamp(value: number, minValue: number, maxValue: number): number {
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}

function handleMove(e: PointerEvent): void {
    const coords = getEventCoord(e);
    if (targetVertexIdx >= 0) {
        vertices[targetVertexIdx].position = px2ndc({
            x: clamp(coords.x, 0, container.clientWidth),
            y: clamp(coords.y, 0, container.clientHeight),
        });
        line.updateVertex(targetVertexIdx, vertices[targetVertexIdx]);
        updateTree();
        runtime.requestRender();
    } else if (targetSegmentIdx >= 0) {
        const v1 = ndc2px(vertices[targetSegmentIdx + 0].position);
        const v2 = ndc2px(vertices[targetSegmentIdx + 1].position);
        const dist = pointToLineDistance2(coords, v1, v2);
        setThickness(dist * 2 | 0);
        runtime.requestRender();
    }
}

function handleUp(_e: PointerEvent): void {
    document.removeEventListener('pointermove', handleMove);
    document.removeEventListener('pointerup', handleUp);
    document.removeEventListener('pointercancel', handleUp);

    targetVertexIdx = -1;
    targetSegmentIdx = -1;
}
