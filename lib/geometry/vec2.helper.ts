import type { Vec2 } from './vec2.types';

export function upd2(out: Vec2, x: number, y: number): Vec2 {
    type V2 = { x: number; y: number; };
    (out as V2).x = x;
    (out as V2).y = y;
    return out;
}
