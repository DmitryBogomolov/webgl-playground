import {
    Runtime,
    Vec2, dist2,
    Tracker,
} from 'lib';
import { State } from './state';
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

const state = new State();

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
    state.thicknessChanged.on(() => {
        line.setThickness(state.thickness);
        runtime.requestRender();
    });
    state.verticesChanged.on(() => {
        line.setVertices(state.vertices);
        runtime.requestRender();
    });
    state.vertexUpdated.on((idx) => {
        line.updateVertex(state.vertices, idx);
        runtime.requestRender();
    });
    line.setVertices(state.vertices);
    line.setThickness(state.thickness);
    return line;
}

setupLine(runtimeBevel, BevelLine);
setupLine(runtimeRound, RoundLine);

function ndc2px(ndc: Vec2): Vec2 {
    return runtimeBevel.ndc2px(ndc);
}

function px2ndc(px: Vec2): Vec2 {
    return runtimeBevel.px2ndc(px);
}

const tree = new SearchTree(() => runtimeBevel.size());
tree.update(state.vertices);

state.verticesChanged.on(() => {
    tree.update(state.vertices);
});
state.vertexUpdated.on(() => {
    tree.update(state.vertices);
});

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
            const vertexCoords = ndc2px(state.vertices[vertexIdx].position);
            const dist = dist2(vertexCoords, coords);
            if (dist <= VERTEX_THRESHOLD) {
                if (state.vertices.length <= 2) {
                    return;
                }
                state.removeVertex(vertexIdx);
            } else {
                state.addVertex(state.vertices.length, px2ndc(coords));
            }
        },
        onStart({ coords }) {
            const vertexIdx = tree.findNearest(px2ndc(coords))!;
            const vertexCoords = ndc2px(state.vertices[vertexIdx].position);
            const dist = dist2(vertexCoords, coords);
            if (dist <= VERTEX_THRESHOLD) {
                motionVertexIdx = vertexIdx;
            } else if (Math.abs(dist - state.thickness / 2) <= BORDER_THRESHOLD) {
                thicknessVertexIdx = vertexIdx;
            }
        },
        onMove({ coords }) {
            if (motionVertexIdx >= 0) {
                state.updateVertex(motionVertexIdx, px2ndc({
                    x: clamp(coords.x, 0, containerBevel.clientWidth),
                    y: clamp(coords.y, 0, containerBevel.clientHeight),
                }));
            } else if (thicknessVertexIdx >= 0) {
                const dist = dist2(coords, ndc2px(state.vertices[thicknessVertexIdx].position));
                state.setThickness(dist * 2 | 0);
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
