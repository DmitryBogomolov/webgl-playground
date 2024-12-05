import { Vec2 } from '../geometry/vec2.types';

export interface TrackerEvent {
    readonly nativeEvent: PointerEvent | MouseEvent;
    readonly coords: Vec2;
}

export interface TrackerHandler {
    (e: TrackerEvent): void;
}

export interface TrackerParams {
    readonly onHover?: TrackerHandler;
    readonly onStart?: TrackerHandler;
    readonly onMove?: TrackerHandler;
    readonly onEnd?: TrackerHandler;
    readonly onClick?: TrackerHandler;
    readonly onDblClick?: TrackerHandler;
}
