import type { Spherical, SphericalMut } from './spherical.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import { upd3 } from './vec3.helper';
import { vec3 } from './vec3';

export function spherical2zxy(coords: Spherical, out: Vec3Mut = vec3(0, 0, 0) as Vec3Mut): Vec3 {
    const { distance, azimuth, elevation } = coords;
    return upd3(
        out,
        distance * Math.cos(elevation) * Math.sin(azimuth),
        distance * Math.sin(elevation),
        distance * Math.cos(elevation) * Math.cos(azimuth),
    );
}

export function zxy2spherical(
    coords: Vec3,
    out: SphericalMut = { distance: 0, azimuth: 0, elevation: 0 } as SphericalMut,
): Spherical {
    const { x, y, z } = coords;
    const r = Math.hypot(x, y, z);
    out.distance = r;
    out.azimuth = Math.atan2(x / r, z / r);
    out.elevation = Math.asin(y / r);
    return out;
}
