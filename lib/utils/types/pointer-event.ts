import { Vec2 } from '../../geometry/types/vec2'

export interface Event {
    readonly clientX: number;
    readonly clientY: number;
}
export type GetEventCoordsFunc = (e: Event) => Vec2;
