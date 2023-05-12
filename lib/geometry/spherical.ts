import type { Spherical } from './spherical.types';
import type { Vec3 } from './vec3.types';
import { upd3 } from './vec3.helper';
import { vec3 } from './vec3';

export function spherical2zxy({ azimuth, elevation }: Spherical, out: Vec3 = vec3(0, 0, 0)): Vec3 {
    return upd3(out,
        Math.cos(elevation) * Math.sin(azimuth),
        Math.sin(elevation),
        Math.cos(elevation) * Math.cos(azimuth),
    );
}

export function zxy2spherical({ x, y, z }: Vec3, out: Spherical = { azimuth: 0, elevation: 0 }): Spherical {
    type Sph = { azimuth: number; elevation: number; };
    (out as Sph).azimuth = Math.atan2(x, z);
    (out as Sph).elevation = Math.asin(y);
    return out;
}
