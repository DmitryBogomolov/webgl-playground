import {
    Runtime,
    Tracker,
    Vec2, dist2,
} from 'lib';
import { SearchTree } from './search-tree';
import { State } from './state';

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

function clamp(value: number, minValue: number, maxValue: number): number {
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}

export function setupTracker(runtime: Runtime, tree: SearchTree, state: State): void {
    let motionVertexIdx: number = -1;
    let thicknessVertexIdx: number = -1;

    function ndc2px(ndc: Vec2): Vec2 {
        return runtime.ndc2px(ndc);
    }

    function px2ndc(px: Vec2): Vec2 {
        return runtime.px2ndc(px);
    }

    const canvas = runtime.canvas();

    new Tracker(canvas, {
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
                    x: clamp(coords.x, 0, canvas.clientWidth),
                    y: clamp(coords.y, 0, canvas.clientHeight),
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
