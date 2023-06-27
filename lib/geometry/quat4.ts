import type { Vec4, Vec4Mut } from './vec4.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import { vec4 } from './vec4';
import { vec3, mul3, clone3, ZERO3 } from './vec3';
import { floatEq } from './float-eq';

export const QUAT4_UNIT = vec4(0, 0, 0, 1);

function v4(): Vec4Mut {
    return vec4(0, 0, 0, 0) as Vec4Mut;
}

export function quat4fromAxisAngle(axis: Vec3, angle: number, out: Vec4Mut = v4()): Vec4 {
    const t = angle / 2;
    mul3(axis, Math.sin(t), out as unknown as Vec3Mut);
    out.w = Math.cos(t);
    return out;
}

export function quat4Angle(q: Vec4): number {
    return Math.acos(q.w) * 2;
}

export function quat4Axis(q: Vec4, out: Vec3Mut = vec3(0, 0, 0) as Vec3Mut): Vec3 {
    const t = Math.sin(quat4Angle(q) / 2);
    if (floatEq(t, 0)) {
        clone3(ZERO3, out);
    } else {
        mul3(q, 1 / t, out);
    }
    return out;
}

export function quat4mul(a: Vec4, b: Vec4, out: Vec4Mut = v4()): Vec4 {
    const { x: ax, y: ay, z: az, w: aw } = a;
    const { x: bx, y: by, z: bz, w: bw } = b;
    out.x = ax * bw + aw * bx + ay * bz - az * by;
    out.y = ay * bw + aw * by + az * bx - ax * bz;
    out.z = az * bw + aw * bz + ax * by - ay * bx;
    out.w = aw * bw - ax * bx - ay * by - az * bz;
    return out;
}
