import type { Vec2, Vec2Mut } from '../geometry/vec2.types';
import { vec2 } from '../geometry/vec2';

export function getEventCoords(e: MouseEvent, out = vec2(0, 0) as Vec2Mut): Vec2 {
    const { left, top } = (e.target as Element).getBoundingClientRect();
    out.x = e.clientX - Math.round(left);
    out.y = e.clientY - Math.round(top);
    return out;
}
