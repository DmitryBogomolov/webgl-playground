import type { Spherical } from './spherical.types';
import type { Vec3 } from './vec3.types';
import { vec3 } from './vec3';

export function spherical2zxy({ azimuth, elevation }: Spherical): Vec3 {
    return vec3(
        Math.cos(elevation) * Math.sin(azimuth),
        Math.sin(elevation),
        Math.cos(elevation) * Math.cos(azimuth),
    );
}

export function zxy2spherical({ x, y, z }: Vec3): Spherical {
    return {
        azimuth: Math.atan2(x, z),
        elevation: Math.asin(y),
    };
}
