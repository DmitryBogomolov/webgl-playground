import type { Vec4, Vec4Mut } from './vec4.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import type { Mat3 } from './mat3.types';
import { vec4, clone4, norm4, dot4 } from './vec4';
import { ZERO3, vec3, clone3, mul3, dot3, cross3, norm3 } from './vec3';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';

export const QUAT4_UNIT = vec4(0, 0, 0, 1);

function v4(): Vec4Mut {
    return vec4(0, 0, 0, 0) as Vec4Mut;
}

export function quat4apply(q: Vec4, v: Vec3, out: Vec3Mut = vec3(0, 0, 0) as Vec3Mut): Vec3 {
    const { x, y, z } = v;
    const { x: qx, y: qy, z: qz, w: qw } = q;
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = - qx * x - qy * y - qz * z;
    out.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
	out.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
	out.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
}

// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
export function quat4mul(a: Vec4, b: Vec4, out: Vec4Mut = v4()): Vec4 {
    const { x: ax, y: ay, z: az, w: aw } = a;
    const { x: bx, y: by, z: bz, w: bw } = b;
    out.x = ax * bw + aw * bx + ay * bz - az * by;
    out.y = ay * bw + aw * by + az * bx - ax * bz;
    out.z = az * bw + aw * bz + ax * by - ay * bx;
    out.w = aw * bw - ax * bx - ay * by - az * bz;
    return out;
}

export function quat4Angle(q: Vec4): number {
    return Math.acos(q.w) * 2;
}

export function quat4Axis(q: Vec4, out: Vec3Mut = vec3(0, 0, 0) as Vec3Mut, eps: number = FLOAT_EQ_EPS): Vec3 {
    const t = Math.sin(quat4Angle(q) / 2);
    if (eq(t, 0, eps)) {
        clone3(ZERO3, out);
    } else {
        mul3(q, 1 / t, out);
    }
    return out;
}

// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
export function quat4conj(q: Vec4, out: Vec4Mut = v4()): Vec4 {
    out.x = -q.x;
    out.y = -q.y;
    out.z = -q.z;
    out.w = q.w;
    return out;
}

export function quat4inv(q: Vec4, out: Vec4Mut = v4()): Vec4 {
    quat4conj(q, out);
    return norm4(out, out);
}

// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
export function quat4fromAxisAngle(axis: Vec3, angle: number, out: Vec4Mut = v4()): Vec4 {
    const t = angle / 2;
    mul3(axis, Math.sin(t), out as unknown as Vec3Mut);
    out.w = Math.cos(t);
    return out;
}

// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
export function quat4fromMat3(mat: Mat3, out: Vec4Mut = v4()): Vec4 {
// TOOD: Add version for Mat4. Provide extract3x3 function for Mat3.
    const [
        m11, m21, m31,
        m12, m22, m32,
        m13, m23, m33,
    ] = mat;
    const trace = m11 + m22 + m33;
    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1);
        out.w = 0.25 / s;
        out.x = (m32 - m23) * s;
        out.y = (m13 - m31) * s;
        out.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
        const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
        out.w = (m32 - m23) / s;
        out.x = 0.25 * s;
        out.y = (m12 + m21) / s;
        out.z = (m13 + m31) / s;
    } else if (m22 > m33) {
        const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
        out.w = (m13 - m31) / s;
        out.x = (m12 + m21) / s;
        out.y = 0.25 * s;
        out.z = (m23 + m32) / s;
    } else {
        const s = 2.0 * Math.sqrt(1 + m33 - m11 - m22);
        out.w = (m21 - m12) / s;
        out.x = (m13 + m31) / s;
        out.y = (m23 + m32) / s;
        out.z = 0.25 * s;
    }
    return out;
}

export function quat4fromVecs(from: Vec3, to: Vec3, out: Vec4Mut = v4(), eps: number = FLOAT_EQ_EPS): Vec4 {
    const k = dot3(from, to);
    if (k <= -1 + eps) {
        if (Math.abs(from.x) > Math.abs(from.z)) {
            out.x = -from.y;
            out.y = +from.x;
            out.z = 0;
        } else {
            out.x = 0;
            out.y = -from.z;
            out.z = +from.y;
        }
        norm3(out, out as unknown as Vec3Mut);
        out.w = 0;
        return out;
    } else if (k >= +1 - eps) {
        return clone4(QUAT4_UNIT, out);
    } else {
        cross3(from, to, out as unknown as Vec3Mut);
        out.w = k + 1;
        return norm4(out, out);
    }
}

// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
export function quat4slerp(a: Vec4, b: Vec4, t: number, out: Vec4Mut = v4(), eps: number = FLOAT_EQ_EPS): Vec4 {
    if (t <= 0) {
        return clone4(a, out);
    }
    if (t >= 1) {
        return clone4(b, out);
    }
    let k = dot4(a, b);
    let sign = 1;
    if (k < 0) {
        k = -k;
        sign = -1;
    }
    let ta = 0;
    let tb = 0;
    if (eq(k, 1, eps)) {
        ta = 1 - t;
        tb = t;
    } else {
        const angle = Math.acos(k);
        const s = Math.sin(angle);
        ta = Math.sin((1 - t) * angle) / s;
        tb = Math.sin(t * angle) / s;
    }
    out.x = a.x * ta + b.x * tb * sign;
    out.y = a.y * ta + b.y * tb * sign;
    out.z = a.z * ta + b.z * tb * sign;
    out.w = a.w * ta + b.w * tb * sign;
    return out;
}
