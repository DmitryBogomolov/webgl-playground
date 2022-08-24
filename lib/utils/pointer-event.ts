import { Vec2, vec2 } from '../geometry/vec2';

interface Event {
    readonly clientX: number;
    readonly clientY: number;
}
export type GetEventCoordsFunc = (e: Event) => Vec2;

export function makeEventCoordsGetter(element: HTMLElement): GetEventCoordsFunc {
    return (e) => {
        const { left, top } = element.getBoundingClientRect();
        return vec2(
            e.clientX - Math.round(left),
            e.clientY - Math.round(top),
        );
    };
}
