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
    (out as unknown as number[]).fill(0);
    return out;
}

export function identity2x2(out: Mat2Mut = m2()): Mat2 {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
}

export function update2x2(values: ReadonlyArray<number>, out: Mat2Mut = m2()): Mat2 {
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
    out[0] = mat[0];
    out[1] = mat[1];
    out[2] = mat[2];
    out[3] = mat[3];
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

function takeRows(mat: Mat2, rows: Vec2Mut[]): void {
    upd2(rows[0], mat[0], mat[2]);
    upd2(rows[1], mat[1], mat[3]);
}

function takeCols(mat: Mat2, cols: Vec2Mut[]): void {
    upd2(cols[0], mat[0], mat[1]);
    upd2(cols[1], mat[2], mat[3]);
}

const _rows = [vec2(0, 0) as Vec2Mut, vec2(0, 0) as Vec2Mut];
const _cols = [vec2(0, 0) as Vec2Mut, vec2(0, 0) as Vec2Mut];

export function mul2x2(lhs: Mat2, rhs: Mat2, out: Mat2Mut = m2()): Mat2 {
    takeRows(lhs, _rows);
    takeCols(rhs, _cols);
    out[0] = dot2(_rows[0], _cols[0]);
    out[1] = dot2(_rows[1], _cols[0]);
    out[2] = dot2(_rows[0], _cols[1]);
    out[3] = dot2(_rows[1], _cols[1]);
    return out;
}

export function mul2v2(lhs: Mat2, rhs: Vec2, out: Vec2Mut = vec2(0, 0) as Vec2Mut): Vec2 {
    takeRows(lhs, _rows);
    return upd2(out,
        dot2(_rows[0], rhs),
        dot2(_rows[1], rhs),
    );
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
