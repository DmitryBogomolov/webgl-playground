export interface Mat4 {
    readonly [i: number]: number;
}

const MAT_SIZE = 16;

export function isMat4(arg: unknown): arg is Mat4 {
    return Array.isArray(arg) && arg.length === MAT_SIZE;
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
