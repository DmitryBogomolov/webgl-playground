import type { Runtime, TrackerEvent, Vec2, Vec2Mut } from 'lib';
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
        const vertices = state.vertices();
        const curr = vertices[vertexIdx];
        const next = vertices[vertexIdx + 1];
        const prev = vertices[vertexIdx - 1];
        const ret = getPxCoords(curr) as Vec2Mut;
        const nextDir = next ? sub2(getPxCoords(next), ret) : ZERO2;
        const prevDir = prev ? sub2(ret, getPxCoords(prev)) : ZERO2;
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
            equal(len, state.thickness() / 2, BORDER_THRESHOLD) &&
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
        const vertexIdx = tree.findNearest(coords);
        if (targetVertex.idx !== vertexIdx) {
            targetVertex = {
                idx: vertexIdx,
                coords: getPxCoords(state.vertices()[vertexIdx]),
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

    function onHover({ coords }: TrackerEvent): void {
        if (action !== 'none') {
            return;
        }
        processPointerPosition(coords);
    }

    function onDblClick({ coords }: TrackerEvent): void {
        if (action !== 'none') {
            return;
        }
        const vertexCount = state.vertices().length;
        if (targetVertex.location === 'center') {
            if (vertexCount <= 2) {
                return;
            }
            state.removeVertex(targetVertex.idx);
        } else {
            state.addVertex(vertexCount, getNdcCoords(coords));
        }
        targetVertex = stubVertex;
        processPointerPosition(coords);
    }

    function onStart(): void {
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
    }

    function onMove({ coords }: TrackerEvent): void {
        switch (action) {
        case 'move_vertex':
            moveVertex(coords);
            break;
        case 'change_thickness':
            changeThickness(coords);
            break;
        }
    }

    function onEnd({ coords }: TrackerEvent): void {
        action = 'none';
        targetVertex = stubVertex;
        processPointerPosition(coords);
    }

    const tracker = new Tracker(canvas);
    tracker.event('hover').on(onHover);
    tracker.event('start').on(onStart);
    tracker.event('move').on(onMove);
    tracker.event('end').on(onEnd);
    tracker.event('dblclick').on(onDblClick);

    return () => tracker.dispose();
}
