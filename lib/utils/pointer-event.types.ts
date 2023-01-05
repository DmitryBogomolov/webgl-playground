import { Vec2 } from '../geometry/vec2.types';

export interface Event {
    readonly clientX: number;
    readonly clientY: number;
}
export type GetEventCoordsFunc = (e: Event) => Vec2;
