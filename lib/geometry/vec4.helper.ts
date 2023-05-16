import type { Vec4, Vec4Mut } from './vec4.types';

export function upd4(out: Vec4Mut, x: number, y: number, z: number, w: number): Vec4 {
    out.x = x;
    out.y = y;
    out.z = z;
    out.w = w;
    return out;
}
