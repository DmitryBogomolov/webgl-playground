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

interface TargetPointInfo {
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

const stubPoint: TargetPointInfo = {
    idx: -1,
    normal: ZERO2,
    coords: ZERO2,
    location: 'none',
};

export function setupTracker(runtime: Runtime, tree: SearchTree, state: State): Tracker {
    let action: 'none' | 'move_point' | 'change_thickness' = 'none';
    let targetPoint = stubPoint;

    const { canvas } = runtime;

    function getCanvasSize(): Vec2 {
        return { x: canvas.clientWidth, y: canvas.clientHeight };
    }

    function getPxCoords(ndc: Vec2): Vec2 {
        return ndc2px(ndc, getCanvasSize());
    }

    function getNdcCoords(px: Vec2): Vec2 {
        return px2ndc(px, getCanvasSize());
    }

    function getPointNormal(pointIdx: number): Vec2 {
        const curr = state.points[pointIdx];
        const next = state.points[pointIdx + 1];
        const prev = state.points[pointIdx - 1];
        const ret = getPxCoords(curr) as Vec2Mut;
        const nextDir = next ? sub2(getPxCoords(next), ret) : ZERO2;
        const prevDir = prev ? sub2(ret, getPxCoords(prev)) : ZERO2;
        add2(prevDir, nextDir, ret);
        rotate2(ret, Math.PI / 2, ret);
        return norm2(ret, ret);
    }

    function getPointLocation(coords: Vec2): TargetPointInfo['location'] {
        const pointer = sub2(coords, targetPoint.coords);
        const len = len2(pointer);
        if (equal(len, 0, VERTEX_THRESHOLD)) {
            return 'center';
        }
        if (
            equal(len, state.thickness() / 2, BORDER_THRESHOLD)
            && equal(Math.abs(dot2(pointer, targetPoint.normal)) / len, 1, 0.1)
        ) {
            return 'border';
        }
        return 'none';
    }

    function getCursor(): string {
        if (action !== 'none') {
            return 'grabbing';
        }
        if (targetPoint.location === 'center') {
            return 'grab';
        }
        if (targetPoint.location === 'border') {
            return 'all-scroll';
        }
        return '';
    }

    function processPointerPosition(coords: Vec2): void {
        const pointIdx = tree.findNearest(coords);
        if (targetPoint.idx !== pointIdx) {
            targetPoint = {
                idx: pointIdx,
                coords: getPxCoords(state.points[pointIdx]),
                normal: getPointNormal(pointIdx),
                location: 'none',
            };
        }

        targetPoint.location = getPointLocation(coords);
        canvas.style.cursor = getCursor();
    }

    function movePoint(coords: Vec2): void {
        state.updatePoint(targetPoint.idx, getNdcCoords({
            x: clamp(coords.x, 0, canvas.clientWidth),
            y: clamp(coords.y, 0, canvas.clientHeight),
        }));
    }

    function changeThickness(coords: Vec2): void {
        const pointer = sub2(coords, targetPoint.coords);
        const len = Math.abs(dot2(pointer, targetPoint.normal)) * 2;
        const thickness = clamp(len, MIN_THICKNESS, MAX_THICKNESS) | 0;
        state.thickness(thickness);
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
        const pointCount = state.points.length;
        if (targetPoint.location === 'center') {
            if (pointCount <= 2) {
                return;
            }
            state.removePoin(targetPoint.idx);
        } else {
            state.addPoint(pointCount, getNdcCoords(coords));
        }
        targetPoint = stubPoint;
        processPointerPosition(coords);
    }

    function onStart(): void {
        if (action !== 'none') {
            return;
        }

        switch (targetPoint.location) {
            case 'center':
                action = 'move_point';
                break;
            case 'border':
                action = 'change_thickness';
                break;
        }
    }

    function onMove({ coords }: TrackerEvent): void {
        switch (action) {
            case 'move_point':
                movePoint(coords);
                break;
            case 'change_thickness':
                changeThickness(coords);
                break;
        }
    }

    function onEnd({ coords }: TrackerEvent): void {
        action = 'none';
        targetPoint = stubPoint;
        processPointerPosition(coords);
    }

    return new Tracker(canvas, {
        start: onStart,
        move: onMove,
        end: onEnd,
        hover: onHover,
        dblclick: onDblClick,
    });
}
