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

function set(mat: Matrix3, values: number[]): Matrix3 {
    for (let i = 0; i < 9; ++i) {
        (mat as number[])[i] = values[i];
    }
    return mat;
}

export const mat3 = {
    create,

    identity(out: Matrix3 = create()): Matrix3 {
        return set(out, [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]);
    },

    clone(mat: Matrix3, out: Matrix3 = create()): Matrix3 {
        return set(out, mat as number[]);
    },

    translation(translation: Vec2, out: Matrix3 = create()): Matrix3 {
        return set(out, [
            1, 0, 0,
            0, 1, 0,
            translation.x, translation.y, 1,
        ]);
    },

    rotation(rotation: number, out: Matrix3 = create()): Matrix3 {
        const c = Math.cos(rotation);
        const s = Math.sin(rotation);
        return set(out, [
            +c, +s, 0,
            -s, +c, 0,
            0, 0, 1,
        ]);
    },

    scaling(scaling: Vec2, out: Matrix3 = create()): Matrix3 {
        return set(out, [
            scaling.x, 0, 0,
            0, scaling.y, 0,
            0, 0, 1,
        ]);
    },
};
