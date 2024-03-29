import type { Runtime, Vec2, Vec2Mut } from 'lib';
import type { SearchTree } from './search-tree';
import type { State } from './state';
import { Tracker, vec2, dist2, ndc2px, px2ndc } from 'lib';

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

function clamp(value: number, minValue: number, maxValue: number): number {
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}

export function setupTracker(runtime: Runtime, tree: SearchTree, state: State): () => void {
    let motionVertexIdx: number = -1;
    let thicknessVertexIdx: number = -1;

    function getPxCoords(ndc: Vec2): Vec2 {
        return ndc2px(ndc, runtime.size(), _v2_scratch);
    }

    function getNdcCoords(px: Vec2): Vec2 {
        return px2ndc(px, runtime.size(), _v2_scratch);
    }

    const _v2_scratch = vec2(0, 0) as Vec2Mut;

    const canvas = runtime.canvas();

    const tracker = new Tracker(canvas, {
        onDblClick({ coords }) {
            const vertexIdx = tree.findNearest(getNdcCoords(coords))!;
            const vertexCoords = getPxCoords(state.vertices[vertexIdx].position);
            const dist = dist2(vertexCoords, coords);
            if (dist <= VERTEX_THRESHOLD) {
                if (state.vertices.length <= 2) {
                    return;
                }
                state.removeVertex(vertexIdx);
            } else {
                state.addVertex(state.vertices.length, getNdcCoords(coords));
            }
        },
        onStart({ coords }) {
            const vertexIdx = tree.findNearest(getNdcCoords(coords))!;
            const vertexCoords = getPxCoords(state.vertices[vertexIdx].position);
            const dist = dist2(vertexCoords, coords);
            if (dist <= VERTEX_THRESHOLD) {
                motionVertexIdx = vertexIdx;
            } else if (Math.abs(dist - state.thickness / 2) <= BORDER_THRESHOLD) {
                thicknessVertexIdx = vertexIdx;
            }
        },
        onMove({ coords }) {
            if (motionVertexIdx >= 0) {
                state.updateVertex(motionVertexIdx, getNdcCoords({
                    x: clamp(coords.x, 0, canvas.clientWidth),
                    y: clamp(coords.y, 0, canvas.clientHeight),
                }));
            } else if (thicknessVertexIdx >= 0) {
                const dist = dist2(coords, getPxCoords(state.vertices[thicknessVertexIdx].position));
                state.setThickness(dist * 2 | 0);
            }
        },
        onEnd() {
            motionVertexIdx = -1;
            thicknessVertexIdx = -1;
        },
    });

    return () => tracker.dispose();
}
