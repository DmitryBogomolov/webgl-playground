import type { Vec3 } from './vec3.types';

export interface Plane3 {
    readonly normal: Vec3;
    readonly distance: number;
}
