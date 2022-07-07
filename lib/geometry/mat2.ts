export interface Mat2 {
    readonly [i: number]: number;
}

const MAT_SIZE = 4;

export function isMat2(arg: unknown): arg is Mat2 {
    return Array.isArray(arg) && arg.length === MAT_SIZE;
}

function create(): Mat2 {
    return [
        0, 0,
        0, 0,
    ];
}

function set(mat: Mat2, ...values: number[]): Mat2 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (mat as number[])[i] = values[i];
    }
    return mat;
}

export const mat2 = {
    create,

    identity(out: Mat2 = create()): Mat2 {
        return set(out,
            1, 0,
            0, 1,
        );
    },

    clone(mat: Mat2, out: Mat2 = create()): Mat2 {
        return set(out, ...(mat as number[]));
    },

    transpose(mat: Mat2, out: Mat2 = create()): Mat2 {
        const [
            m11, m21,
            m12, m22,
        ] = mat as number[];
        return set(out,
            m11, m12,
            m21, m22,
        );
    },

    mul(lhs: Mat2, rhs: Mat2, out: Mat2 = create()): Mat2 {
        const [
            a11, a21,
            a12, a22,
        ] = lhs as number[];
        const [
            b11, b21,
            b12, b22,
        ] = rhs as number[];
        return set(out,
            a11 * b11 + a12 * b21,
            a21 * b11 + a12 * b21,
            a11 * b12 + a12 * b22,
            a21 * b12 + a22 * b22,
        );
    },
};
