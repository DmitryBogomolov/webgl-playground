import { Vec2, mul2 } from './vec2';

export interface Mat3 {
    readonly [i: number]: number;
}

const MAT_SIZE = 9;

export function isMat3(arg: unknown): arg is Mat3 {
    return Array.isArray(arg) && arg.length === MAT_SIZE;
}

function create(): Mat3 {
    return [
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
    ];
}

function set(mat: Mat3, ...values: number[]): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (mat as number[])[i] = values[i];
    }
    return mat;
}

const _tmpMat = create();

export const mat3 = {
    create,

    identity(out: Mat3 = create()): Mat3 {
        return set(out,
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        );
    },

    clone(mat: Mat3, out: Mat3 = create()): Mat3 {
        return set(out, ...(mat as number[]));
    },

    transpose(mat: Mat3, out: Mat3 = create()): Mat3 {
        const [
            m11, m21, m31,
            m12, m22, m32,
            m13, m23, m33,
        ] = mat as number[];
        return set(out,
            m11, m12, m13,
            m21, m22, m23,
            m31, m32, m33,
        );
    },

    mul(lhs: Mat3, rhs: Mat3, out: Mat3 = create()): Mat3 {
        const [
            a11, a21, a31,
            a12, a22, a32,
            a13, a23, a33,
        ] = lhs as number[];
        const [
            b11, b21, b31,
            b12, b22, b32,
            b13, b23, b33,
        ] = rhs as number[];
        return set(out,
            a11 * b11 + a12 * b21 + a13 * b31,
            a21 * b11 + a22 * b21 + a23 * b31,
            a31 * b11 + a32 * b21 + a33 * b31,
            a11 * b12 + a12 * b22 + a13 * b32,
            a21 * b12 + a22 * b22 + a23 * b32,
            a31 * b12 + a32 * b22 + a33 * b32,
            a11 * b13 + a12 * b23 + a13 * b33,
            a21 * b13 + a22 * b23 + a23 * b33,
            a31 * b13 + a32 * b23 + a33 * b33,
        );
    },

    translation(translation: Vec2, out: Mat3 = create()): Mat3 {
        return set(out,
            1, 0, 0,
            0, 1, 0,
            translation.x, translation.y, 1,
        );
    },

    translate(mat: Mat3, translation: Vec2): void {
        const t = mat3.translation(translation, _tmpMat);
        mat3.mul(t, mat, mat);
    },

    rotation(rotation: number, out: Mat3 = create()): Mat3 {
        const c = Math.cos(rotation);
        const s = Math.sin(rotation);
        return set(out,
            +c, +s, 0,
            -s, +c, 0,
            0, 0, 1,
        );
    },

    rotate(mat: Mat3, rotation: number): void {
        const t = mat3.rotation(rotation, _tmpMat);
        mat3.mul(t, mat, mat);
    },

    scaling(scaling: Vec2, out: Mat3 = create()): Mat3 {
        return set(out,
            scaling.x, 0, 0,
            0, scaling.y, 0,
            0, 0, 1,
        );
    },

    scale(mat: Mat3, scaling: Vec2): void {
        const t = mat3.scaling(scaling, _tmpMat);
        mat3.mul(t, mat, mat);
    },

    projection(size: Vec2, origin: Vec2 = mul2(size, 0.5), out: Mat3 = create()): Mat3 {
        const kx = 2 / size.x;
        const ky = 2 / size.y;
        const dx = -(origin.x - size.x / 2) * kx;
        const dy = -(origin.y - size.y / 2) * ky;
        return set(out,
            kx, 0, 0,
            0, ky, 0,
            dx, dy, 1,
        );
    },

    project(mat: Mat3, size: Vec2, origin: Vec2 = mul2(size, 0.5)): void {
        const t = mat3.projection(size, origin, _tmpMat);
        mat3.mul(t, mat, mat);
    },
};
