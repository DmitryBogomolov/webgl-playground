import type { Runtime, Vec2, Vec2Mut } from 'lib';
import type { SearchTree } from './search-tree';
import type { State } from './state';
import {
    Tracker, ZERO2, ndc2px, px2ndc, len2, add2, sub2, rotate2, norm2, dot2,
} from 'lib';

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;
const MIN_THICKNESS = 4;
const MAX_THICKNESS = 100;

interface TargetVertexInfo {
    readonly idx: number;
    readonly coords: Vec2;
    readonly normal: Vec2;
    location: 'none' | 'center' | 'border';
}

function clamp(value: number, minValue: number, maxValue: number): number {
    return value < minValue ? minValue : (value > maxValue ? maxValue : value);
}

function equal(lhs: number, rhs: number, threshold: number): boolean {
    return Math.abs(lhs - rhs) <= threshold;
}

const stubVertex: TargetVertexInfo = {
    idx: -1,
    normal: ZERO2,
    coords: ZERO2,
    location: 'none',
};

export function setupTracker(runtime: Runtime, tree: SearchTree, state: State): () => void {
    let action: 'none' | 'move_vertex' | 'change_thickness' = 'none';
    let targetVertex = stubVertex;

    function getPxCoords(ndc: Vec2): Vec2 {
        return ndc2px(ndc, runtime.size());
    }

    function getNdcCoords(px: Vec2): Vec2 {
        return px2ndc(px, runtime.size());
    }

    const canvas = runtime.canvas();

    function getVertexNormal(vertexIdx: number): Vec2 {
        const curr = state.vertices[vertexIdx];
        const next = state.vertices[vertexIdx + 1];
        const prev = state.vertices[vertexIdx - 1];
        const ret = getPxCoords(curr.position) as Vec2Mut;
        const nextDir = next ? sub2(getPxCoords(next.position), ret) : ZERO2;
        const prevDir = prev ? sub2(ret, getPxCoords(prev.position)) : ZERO2;
        add2(prevDir, nextDir, ret);
        rotate2(ret, Math.PI / 2, ret);
        return norm2(ret, ret);
    }

    function getVertexLocation(coords: Vec2): TargetVertexInfo['location'] {
        const pointer = sub2(coords, targetVertex.coords);
        const len = len2(pointer);
        if (equal(len, 0, VERTEX_THRESHOLD)) {
            return 'center';
        }
        if (
            equal(len, state.thickness / 2, BORDER_THRESHOLD) &&
            equal(Math.abs(dot2(pointer, targetVertex.normal)) / len, 1, 0.1)
        ) {
            return 'border';
        }
        return 'none';
    }

    function getCursor(): string {
        if (action !== 'none') {
            return 'grabbing';
        }
        if (targetVertex.location === 'center') {
            return 'grab';
        }
        if (targetVertex.location === 'border') {
            return 'all-scroll';
        }
        return '';
    }

    function processPointerPosition(coords: Vec2): void {
        // TODO_THIS: Keep tree in px space. Get rid of coords conversion.
        const vertexIdx = tree.findNearest(getNdcCoords(coords))!;
        if (targetVertex.idx !== vertexIdx) {
            targetVertex = {
                idx: vertexIdx,
                coords: getPxCoords(state.vertices[vertexIdx].position),
                normal: getVertexNormal(vertexIdx),
                location: 'none',
            };
        }

        targetVertex.location = getVertexLocation(coords);
        canvas.style.cursor = getCursor();
    }

    function moveVertex(coords: Vec2): void {
        state.updateVertex(targetVertex.idx, getNdcCoords({
            x: clamp(coords.x, 0, canvas.clientWidth),
            y: clamp(coords.y, 0, canvas.clientHeight),
        }));
    }

    function changeThickness(coords: Vec2): void {
        const pointer = sub2(coords, targetVertex.coords);
        const len = Math.abs(dot2(pointer, targetVertex.normal)) * 2;
        const thickness = clamp(len, MIN_THICKNESS, MAX_THICKNESS) | 0;
        state.setThickness(thickness);
    }

    const tracker = new Tracker(canvas, {
        onDblClick({ coords }) {
            if (action !== 'none') {
                return;
            }
            if (targetVertex.location === 'center') {
                if (state.vertices.length <= 2) {
                    return;
                }
                state.removeVertex(targetVertex.idx);
            } else {
                state.addVertex(state.vertices.length, getNdcCoords(coords));
            }
            targetVertex = stubVertex;
            processPointerPosition(coords);
        },
        onHover({ coords }) {
            if (action !== 'none') {
                return;
            }
            processPointerPosition(coords);
        },
        onStart() {
            if (action !== 'none') {
                return;
            }

            switch (targetVertex.location) {
            case 'center':
                action = 'move_vertex';
                break;
            case 'border':
                action = 'change_thickness';
                break;
            }
        },
        onMove({ coords }) {
            switch (action) {
            case 'move_vertex':
                moveVertex(coords);
                break;
            case 'change_thickness':
                changeThickness(coords);
                break;
            }
        },
        onEnd({ coords }) {
            action = 'none';
            targetVertex = stubVertex;
            processPointerPosition(coords);
        },
    });

    return () => tracker.dispose();
}
