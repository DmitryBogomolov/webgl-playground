import type { Vec2, Vec2Mut } from './vec2.types';

export function upd2(out: Vec2Mut, x: number, y: number): Vec2 {
    out.x = x;
    out.y = y;
    return out;
}
