import { Vec3, norm3 } from './vec3';

export interface Mat4 {
    readonly [i: number]: number;
}

const MAT_SIZE = 16;

export function isMat4(mat: unknown): mat is Mat4 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat4(): Mat4 {
    return [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ];
}

function set(mat: Mat4, ...values: number[]): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (mat as number[])[i] = values[i];
    }
    return mat;
}


export function identity4x4(out: Mat4 = mat4()): Mat4 {
    return set(out,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    );
}

export function clone4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    return set(out, ...(mat as number[]));
}

export function transpose4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    const [
        m11, m21, m31, m41,
        m12, m22, m32, m42,
        m13, m23, m33, m43,
        m14, m24, m34, m44,
    ] = mat as number[];
    return set(out,
        m11, m12, m13, m14,
        m21, m22, m23, m24,
        m31, m32, m33, m34,
        m41, m42, m43, m44,
    );
}

export function mul4x4(lhs: Mat4, rhs: Mat4, out: Mat4 = mat4()): Mat4 {
    const [
        a11, a21, a31, a41,
        a12, a22, a32, a42,
        a13, a23, a33, a43,
        a14, a24, a34, a44,
    ] = lhs as number[];
    const [
        b11, b21, b31, b41,
        b12, b22, b32, b42,
        b13, b23, b33, b43,
        b14, b24, b34, b44,
    ] = rhs as number[];
    return set(out,
        a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41,
        a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41,
        a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41,
        a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41,
        a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42,
        a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42,
        a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42,
        a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42,
        a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43,
        a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43,
        a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43,
        a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43,
        a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44,
        a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44,
        a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44,
        a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44,
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SkipLast<T> = T extends [...args: infer P, last?: any] ? P : never;
const _tmpMat = mat4();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apply4x4<T extends (...args: any[]) => any>(
    mat: Mat4, func: T, ...args: SkipLast<Parameters<T>>
): void {
    func(...args, _tmpMat);
    mul4x4(_tmpMat, mat, mat);
}

export function translation4x4(translation: Vec3, out: Mat4 = mat4()): Mat4 {
    return set(out,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translation.x, translation.y, translation.z, 1,
    );
}

export function scaling4x4(scaling: Vec3, out: Mat4 = mat4()): Mat4 {
    return set(out,
        scaling.x, 0, 0, 0,
        0, scaling.y, 0, 0,
        0, 0, scaling.z, 0,
        0, 0, 0, 1,
    );
}

export function rotation4x4(axis: Vec3, rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const t = 1 - c;
    const { x, y, z } = norm3(axis);
    return set(out,
        x * x * t + c, y * x * t + z * s, z * x * t - y * s, 0,
        x * y * t - z * s, y * y * t + c, z * y * t + x * s, 0,
        x * z * t + y * s, y * z * t - x * s, z * z * t + c, 0,
        0, 0, 0, 1,
    );
}

export function xrotation4x4(rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return set(out,
        1, 0, 0, 0,
        0, +c, +s, 0,
        0, -s, +c, 0,
        0, 0, 0, 1,
    );
}

export function yrotation4x4(rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return set(out,
        +c, 0, -s, 0,
        0, 1, 0, 0,
        +s, 0, +c, 0,
        0, 0, 0, 1,
    );
}

export function zrotation4x4(rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return set(out,
        +c, +s, 0, 0,
        -s, +c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    );
}

export interface OrthogrpahicOptions {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly near: number;
    readonly far: number;
}

export function orthographic4x4(options: OrthogrpahicOptions, out: Mat4 = mat4()): Mat4 {
    const { left, right, bottom, top, near, far } = options;
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    return set(out,
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        (left + right) * lr, (bottom + top) * bt, (near + far) * nf, 1,
    );
}
