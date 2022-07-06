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

export const mat3 = {
    create,

    identity(out: Matrix3 = create()): Matrix3 {
        const target = out as number[];
        target[0] = target[4] = target[8] = 1;
        return out;
    },

    clone(out: Matrix3 = create(), mat: Matrix3): Matrix3 {
        const target = out as number[];
        for (let i = 0; i < 9; ++i) {
            target[i] = mat[i];
        }
        return out;
    },
};
