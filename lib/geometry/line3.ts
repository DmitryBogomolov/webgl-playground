import type { Line3 } from './types/line3';
import type { Vec3 } from './types/vec3';
import { vec3, isVec3, norm3 } from './vec3';

export class Line3Impl implements Line3 {
    readonly direction: Vec3;
    readonly anchor: Vec3;

    constructor(direction: Vec3, anchor: Vec3) {
        this.direction = normalizeDirection(direction);
        this.anchor = normalizeAnchor(anchor, this.direction);
    }
}

function normalizeDirection(direction: Vec3): Vec3 {
    const d = norm3(direction);
    return d.x >= 0 ? d : vec3(-d.x, d.y, d.z);
}

function normalizeAnchor(anchor: Vec3, direction: Vec3): Vec3 {
    // TODO...
    return anchor;
}

export function line3(direction: Vec3, anchor: Vec3): Line3 {
    return new Line3Impl(direction, anchor);
}

export function isLine3(l: unknown): l is Line3 {
    return !!l &&(isVec3((l as Line3).direction) && isVec3((l as Line3).anchor));
}
