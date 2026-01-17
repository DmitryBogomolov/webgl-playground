import type { Mat2, Mat2Mut } from './mat2.types';
import type { Vec2, Vec2Mut } from './vec2.types';
import { upd2 } from './vec2.helper';
import { vec2, dot2 } from './vec2';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';

const MAT_RANK = 2;
const MAT_SIZE = MAT_RANK ** 2;

export function isMat2(mat: unknown): mat is Mat2 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat2(): Mat2 {
    return [0, 0, 0, 0];
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

function m2(): Mat2Mut {
    return mat2() as Mat2Mut;
}

export function zero2x2(out: Mat2Mut = m2()): Mat2 {
    out.fill(0);
    return out;
}

export function identity2x2(out: Mat2Mut = m2()): Mat2 {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
}

export function update2x2(values: ArrayLike<number>, out: Mat2Mut = m2()): Mat2 {
    out[0] = values[0];
    out[1] = values[1];
    out[2] = values[2];
    out[3] = values[3];
    return out;
}

export function clone2x2(mat: Mat2, out: Mat2Mut = m2()): Mat2 {
    if (mat === out) {
        return out;
    }
    return update2x2(mat, out);
}

function v2(): Vec2Mut {
    return vec2(0, 0) as Vec2Mut;
}

export function mat2row(mat: Mat2, row: number, out: Vec2Mut = v2()): Vec2 {
    const k = row | 0;
    upd2(out, mat[k], mat[k + 2]);
    return out;
}

export function mat2col(mat: Mat2, col: number, out: Vec2Mut = v2()): Vec2 {
    const k = col << 1;
    upd2(out, mat[k], mat[k + 1]);
    return out;
}

export function transpose2x2(mat: Mat2, out: Mat2Mut = m2()): Mat2 {
    clone2x2(mat, out);
    const tmp = out[1];
    out[1] = out[2];
    out[2] = tmp;
    return out;
}

export function add2x2(lhs: Mat2, rhs: Mat2, out: Mat2Mut = m2()): Mat2 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = lhs[i] + rhs[i];
    }
    return out;
}

export function sub2x2(lhs: Mat2, rhs: Mat2, out: Mat2Mut = m2()): Mat2 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = lhs[i] - rhs[i];
    }
    return out;
}

const _mul2x2_aux_rows = [v2(), v2()];
const _mul2x2_aux_cols = [v2(), v2()];
export function mul2x2(lhs: Mat2, rhs: Mat2, out: Mat2Mut = m2()): Mat2 {
    const rows = _mul2x2_aux_rows;
    const cols = _mul2x2_aux_cols;
    for (let i = 0; i < MAT_RANK; ++i) {
        mat2row(lhs, i, rows[i]);
        mat2col(rhs, i, cols[i]);
    }
    out[0] = dot2(rows[0], cols[0]);
    out[1] = dot2(rows[1], cols[0]);
    out[2] = dot2(rows[0], cols[1]);
    out[3] = dot2(rows[1], cols[1]);
    return out;
}

export function mul2v2(lhs: Mat2, rhs: Vec2, out: Vec2Mut = v2()): Vec2 {
    const x = dot2(mat2row(lhs, 0, out), rhs);
    const y = dot2(mat2row(lhs, 1, out), rhs);
    return upd2(out, x, y);
}

export function det2x2(mat: Mat2): number {
    return mat[0] * mat[3] - mat[2] * mat[1];
}

export function adjugate2x2(mat: Mat2, out: Mat2Mut = m2()): Mat2 {
    out[0] = +mat[3];
    out[1] = -mat[1];
    out[2] = -mat[2];
    out[3] = +mat[0];
    return out;
}

export function inverse2x2(mat: Mat2, out: Mat2Mut = m2()): Mat2 {
    let k = 1 / det2x2(mat);
    if (!Number.isFinite(k)) {
        k = 0;
    }
    adjugate2x2(mat, out);
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = out[i] * k;
    }
    return out;
}
