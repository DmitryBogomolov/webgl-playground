import type { Vec3 } from './vec3.types';

export interface Line3 {
    readonly direction: Vec3;
    readonly anchor: Vec3;
}
