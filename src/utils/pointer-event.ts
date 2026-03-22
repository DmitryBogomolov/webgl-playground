import type { Vec2, Vec2Mut } from '../geometry/vec2.types';

export function getEventCoords(
    e: MouseEvent,
    element: Element | null = null,
    out = { x: 0, y: 0 } as Vec2Mut,
): Vec2 {
    const { left, top } = (element ?? e.target as Element).getBoundingClientRect();
    out.x = e.clientX - Math.round(left);
    out.y = e.clientY - Math.round(top);
    return out;
}
