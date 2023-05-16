import type { Spherical, SphericalMut } from './spherical.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import { upd3 } from './vec3.helper';
import { vec3 } from './vec3';

export function spherical2zxy(
    { azimuth, elevation }: Spherical, out: Vec3Mut = vec3(0, 0, 0) as Vec3Mut,
): Vec3 {
    return upd3(out,
        Math.cos(elevation) * Math.sin(azimuth),
        Math.sin(elevation),
        Math.cos(elevation) * Math.cos(azimuth),
    );
}

export function zxy2spherical(
    { x, y, z }: Vec3, out: SphericalMut = { azimuth: 0, elevation: 0 } as SphericalMut,
): Spherical {
    out.azimuth = Math.atan2(x, z);
    out.elevation = Math.asin(y);
    return out;
}
