import type { GetEventCoordsFunc } from './pointer-event.types';
import { vec2 } from '../geometry/vec2';

export function makeEventCoordsGetter(element: HTMLElement): GetEventCoordsFunc {
    return (e) => {
        const { left, top } = element.getBoundingClientRect();
        return vec2(
            e.clientX - Math.round(left),
            e.clientY - Math.round(top),
        );
    };
}
