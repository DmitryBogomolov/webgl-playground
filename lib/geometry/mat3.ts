import { Vec2 } from './vec2';

export interface Matrix3 {
    readonly [i: number]: number;
}

function create(): Matrix3 {
    return [
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
    ];
}

function set(mat: Matrix3, ...values: number[]): Matrix3 {
    for (let i = 0; i < 9; ++i) {
        (mat as number[])[i] = values[i];
    }
    return mat;
}

export const mat3 = {
    create,

    identity(out: Matrix3 = create()): Matrix3 {
        return set(out,
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        );
    },

    clone(mat: Matrix3, out: Matrix3 = create()): Matrix3 {
        return set(out, ...(mat as number[]));
    },

    mul(lhs: Matrix3, rhs: Matrix3, out: Matrix3 = create()): Matrix3 {
        const [a11, a21, a31, a12, a22, a32, a13, a23, a33] = lhs as number[];
        const [b11, b21, b31, b12, b22, b32, b13, b23, b33] = rhs as number[];
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

    translation(translation: Vec2, out: Matrix3 = create()): Matrix3 {
        return set(out,
            1, 0, 0,
            0, 1, 0,
            translation.x, translation.y, 1,
        );
    },

    rotation(rotation: number, out: Matrix3 = create()): Matrix3 {
        const c = Math.cos(rotation);
        const s = Math.sin(rotation);
        return set(out,
            +c, +s, 0,
            -s, +c, 0,
            0, 0, 1,
        );
    },

    scaling(scaling: Vec2, out: Matrix3 = create()): Matrix3 {
        return set(out,
            scaling.x, 0, 0,
            0, scaling.y, 0,
            0, 0, 1,
        );
    },
};
