import type { Vec2 } from '../geometry/vec2.types';
import type { EventProxy } from './event-emitter.types';

export interface TrackerEvent {
    readonly nativeEvent: PointerEvent | MouseEvent;
    readonly coords: Vec2;
}

export type TRACKER_EVENTS = 'click' | 'dblclick' | 'hover' | 'start' | 'move' | 'end';

export type TrackerEventProxy = EventProxy<[TrackerEvent]>;
