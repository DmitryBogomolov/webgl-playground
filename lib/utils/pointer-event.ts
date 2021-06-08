import { Vec2 } from '../geometry/vec2';

export type GetEventCoordsCallback = (e: PointerEvent) => Vec2;

export function makeEventCoordsGetter(element: HTMLElement): GetEventCoordsCallback {
    return (e) => {
        const { left, top } = element.getBoundingClientRect();
        return {
            x: e.pageX - left,
            y: e.pageY - top,
        };
    };
}
