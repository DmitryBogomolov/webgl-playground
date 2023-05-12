import type { Vec4 } from './vec4.types';

export function upd4(out: Vec4, x: number, y: number, z: number, w: number): Vec4 {
    type V4 = { x: number; y: number; z: number; w: number; };
    (out as V4).x = x;
    (out as V4).y = y;
    (out as V4).z = z;
    (out as V4).w = w;
    return out;
}
