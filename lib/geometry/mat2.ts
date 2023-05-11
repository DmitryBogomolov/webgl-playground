import type { Mat2 } from './mat2.types';
import type { Vec2 } from './vec2.types';
import { upd2 } from './vec2.helper';
import { vec2 } from './vec2';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';

const MAT_RANK = 2;
const MAT_SIZE = MAT_RANK ** 2;

export function isMat2(mat: unknown): mat is Mat2 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat2(): Mat2 {
    return Array<number>(MAT_SIZE).fill(0);
}

export function eq2x2(lhs: Mat2, rhs: Mat2, eps: number = FLOAT_EQ_EPS): boolean {
    if (lhs === rhs) {
        return true;
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        if (!eq(lhs[i], rhs[i], eps)) {
            return false;
        }
    }
    return true;
}

export function zero2x2(out: Mat2 = mat2()): Mat2 {
    (out as number[]).fill(0);
    return out;
}

export function identity2x2(out: Mat2 = mat2()): Mat2 {
    (out as number[])[0] = 1;
    (out as number[])[1] = 0;
    (out as number[])[2] = 0;
    (out as number[])[3] = 1;
    return out;
}

export function update2x2(values: ReadonlyArray<number>, out: Mat2 = mat2()): Mat2 {
    (out as number[])[0] = values[0];
    (out as number[])[1] = values[2];
    (out as number[])[2] = values[1];
    (out as number[])[3] = values[3];
    return out;
}

export function clone2x2(mat: Mat2, out: Mat2 = mat2()): Mat2 {
    if (mat === out) {
        return out;
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = mat[i];
    }
    return out;
}

export function transpose2x2(mat: Mat2, out: Mat2 = mat2()): Mat2 {
    const [
        m11, m21,
        m12, m22,
    ] = mat as number[];
    (out as number[])[0] = m11;
    (out as number[])[1] = m12;
    (out as number[])[2] = m21;
    (out as number[])[3] = m22;
    return out;
}

export function add2x2(lhs: Mat2, rhs: Mat2, out: Mat2 = mat2()): Mat2 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = lhs[i] + rhs[i];
    }
    return out;
}

export function sub2x2(lhs: Mat2, rhs: Mat2, out: Mat2 = mat2()): Mat2 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = lhs[i] - rhs[i];
    }
    return out;
}

export function mul2x2(lhs: Mat2, rhs: Mat2, out: Mat2 = mat2()): Mat2 {
    const [
        a11, a21,
        a12, a22,
    ] = lhs as number[];
    const [
        b11, b21,
        b12, b22,
    ] = rhs as number[];
    (out as number[])[0] = a11 * b11 + a12 * b21;
    (out as number[])[1] = a21 * b11 + a22 * b21;
    (out as number[])[2] = a11 * b12 + a12 * b22;
    (out as number[])[3] = a21 * b12 + a22 * b22;
    return out;
}

export function mul2v2(lhs: Mat2, rhs: Vec2, out: Vec2 = vec2(0, 0)): Vec2 {
    const [
        a11, a21,
        a12, a22,
    ] = lhs as number[];
    const { x, y } = rhs;
    return upd2(out,
        a11 * x + a12 * y,
        a21 * x + a22 * y,
    );
}

export function det2x2(mat: Mat2): number {
    return mat[0] * mat[3] - mat[2] * mat[1];
}

export function adjugate2x2(mat: Mat2, out: Mat2 = mat2()): Mat2 {
    const [
        m11, m21,
        m12, m22,
    ] = mat as number[];
    (out as number[])[0] = m22;
    (out as number[])[1] = -m21;
    (out as number[])[2] = -m12;
    (out as number[])[3] = m11;
    return out;
}

export function inverse2x2(mat: Mat2, out: Mat2 = mat2()): Mat2 {
    let k = 1 / det2x2(mat);
    if (!Number.isFinite(k)) {
        k = 0;
    }
    adjugate2x2(mat, out);
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = out[i] * k;
    }
    return out;
}
