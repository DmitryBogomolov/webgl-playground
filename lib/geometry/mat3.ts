import { Vec2, mul2 } from './vec2';

export interface Mat3 {
    readonly [i: number]: number;
}

const MAT_SIZE = 9;

export function isMat3(mat: unknown): mat is Mat3 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat3(): Mat3 {
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

export function identity3x3(out: Mat3 = mat3()): Mat3 {
    return set(out,
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    );
}

export function clone3x3(mat: Mat3, out: Mat3 = mat3()): Mat3 {
    return set(out, ...(mat as number[]));
}

export function transpose3x3(mat: Mat3, out: Mat3 = mat3()): Mat3 {
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
}

export function mul3x3(lhs: Mat3, rhs: Mat3, out: Mat3 = mat3()): Mat3 {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SkipLast<T> = T extends [...args: infer P, last?: any] ? P : never;
const _tmpMat = mat3();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apply3x3<T extends (...args: any[]) => any>(
    mat: Mat3, func: T, ...args: SkipLast<Parameters<T>>
): void {
    func(...args, _tmpMat);
    mul3x3(_tmpMat, mat, mat);
}

export function translation3x3(translation: Vec2, out: Mat3 = mat3()): Mat3 {
    return set(out,
        1, 0, 0,
        0, 1, 0,
        translation.x, translation.y, 1,
    );
}

export function rotation3x3(rotation: number, out: Mat3 = mat3()): Mat3 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    return set(out,
        +c, +s, 0,
        -s, +c, 0,
        0, 0, 1,
    );
}

export function scaling3x3(scaling: Vec2, out: Mat3 = mat3()): Mat3 {
    return set(out,
        scaling.x, 0, 0,
        0, scaling.y, 0,
        0, 0, 1,
    );
}

export function projection3x3(size: Vec2, origin: Vec2 = mul2(size, 0.5), out: Mat3 = mat3()): Mat3 {
    const kx = 2 / size.x;
    const ky = 2 / size.y;
    const dx = -(origin.x - size.x / 2) * kx;
    const dy = -(origin.y - size.y / 2) * ky;
    return set(out,
        kx, 0, 0,
        0, ky, 0,
        dx, dy, 1,
    );
}
