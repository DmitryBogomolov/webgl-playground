import type { Vec3, Vec3Mut } from './vec3.types';

export function upd3(out: Vec3Mut, x: number, y: number, z: number): Vec3 {
    out.x = x;
    out.y = y;
    out.z = z;
    return out;
}
