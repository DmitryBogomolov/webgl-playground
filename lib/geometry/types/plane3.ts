import type { Vec3 } from './vec3';

export interface Plane3 {
    readonly normal: Vec3;
    readonly distance: number;
}
