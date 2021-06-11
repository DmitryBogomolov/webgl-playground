import { Vec2 } from '../geometry/vec2';

interface Event {
    readonly pageX: number;
    readonly pageY: number;
}
export type GetEventCoordsFunc = (e: Event) => Vec2;

export function makeEventCoordsGetter(element: HTMLElement): GetEventCoordsFunc {
    return (e) => {
        const { left, top } = element.getBoundingClientRect();
        return {
            x: e.pageX - left,
            y: e.pageY - top,
        };
    };
}
