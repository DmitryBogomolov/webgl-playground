import type { Vec3 } from './vec3.types';

export function upd3(out: Vec3, x: number, y: number, z: number): Vec3 {
    type V3 = { x: number; y: number; z: number; };
    (out as V3).x = x;
    (out as V3).y = y;
    (out as V3).z = z;
    return out;
}
