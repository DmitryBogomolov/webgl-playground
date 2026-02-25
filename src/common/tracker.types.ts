import type { Vec2 } from '../geometry/vec2.types';

export interface TrackerEvent {
    readonly nativeEvent: PointerEvent | MouseEvent;
    readonly coords: Vec2;
}

export type TRACKER_EVENTS = 'click' | 'dblclick' | 'hover' | 'start' | 'move' | 'end';

export type TrackerEventHandler = (e: TrackerEvent) => void;

export type TrackerHandlers = Readonly<Partial<Record<TRACKER_EVENTS, TrackerEventHandler>>>;
