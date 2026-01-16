import type { Mat3, Mat3Mut } from './mat3.types';
import type { Vec2, Vec2Mut } from './vec2.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import type { AnyFunc, SkipLastArg } from './helpers.types';
import { upd2 } from './vec2.helper';
import { vec2 } from './vec2';
import { upd3 } from './vec3.helper';
import { vec3, dot3 } from './vec3';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';
import { range, rowcol2idxRank, idx2rowcolRank, excludeRowColRank } from './helpers';

const MAT_RANK = 3;
const MAT_SIZE = MAT_RANK ** 2;

const rowcol2idx = rowcol2idxRank.bind(null, MAT_RANK);
const idx2rowcol = idx2rowcolRank.bind(null, MAT_RANK);
const excludeRowCol = excludeRowColRank.bind(null, MAT_RANK);

export function isMat3(mat: unknown): mat is Mat3 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat3(): Mat3 {
    return Array.from({ length: MAT_SIZE }, () => 0);
}

export function eq3x3(lhs: Mat3, rhs: Mat3, eps: number = FLOAT_EQ_EPS): boolean {
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

function m3(): Mat3Mut {
    return mat3() as Mat3Mut;
}

export function zero3x3(out: Mat3Mut = m3()): Mat3 {
    (out as unknown as number[]).fill(0);
    return out;
}

const IDENTITY3X3_MAP = { xx: rowcol2idx(0, 0), yy: rowcol2idx(1, 1), zz: rowcol2idx(2, 2) } as const;
export function identity3x3(out: Mat3Mut = m3()): Mat3 {
    zero3x3(out);
    const { xx, yy, zz } = IDENTITY3X3_MAP;
    out[xx] = out[yy] = out[zz] = 1;
    return out;
}

export function update3x3(values: ArrayLike<number>, out: Mat3Mut = m3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = values[i];
    }
    return out;
}

export function clone3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    if (mat === out) {
        return out;
    }
    return update3x3(mat as number[], out);
}

const TRANSPOSE3X3_MAP = range(MAT_SIZE, (idx) => {
    const { row, col } = idx2rowcol(idx);
    return row < col ? { idx1: idx, idx2: rowcol2idx(col, row) } as const : null;
});
export function transpose3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    clone3x3(mat, out);
    for (const { idx1, idx2 } of TRANSPOSE3X3_MAP) {
        const tmp = out[idx1];
        out[idx1] = out[idx2];
        out[idx2] = tmp;
    }
    return out;
}

export function add3x3(lhs: Mat3, rhs: Mat3, out: Mat3Mut = m3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = lhs[i] + rhs[i];
    }
    return out;
}

export function sub3x3(lhs: Mat3, rhs: Mat3, out: Mat3Mut = m3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = lhs[i] - rhs[i];
    }
    return out;
}

function v3(): Vec3Mut {
    return vec3(0, 0, 0) as Vec3Mut;
}

function takeVec3(mat: Mat3, indices: ReadonlyArray<number>, v: Vec3Mut): void {
    upd3(v, mat[indices[0]], mat[indices[1]], mat[indices[2]]);
}

const ROWS_MAP = range(MAT_RANK, (row) => range(MAT_RANK, (k) => rowcol2idx(row, k)));
function takeRows(mat: Mat3, rows: Vec3Mut[]): void {
    for (let i = 0; i < ROWS_MAP.length; ++i) {
        takeVec3(mat, ROWS_MAP[i], rows[i]);
    }
}

const COLS_MAP = range(MAT_RANK, (col) => range(MAT_RANK, (k) => rowcol2idx(k, col)));
function takeCols(mat: Mat3, cols: Vec3Mut[]): void {
    for (let i = 0; i < COLS_MAP.length; ++i) {
        takeVec3(mat, COLS_MAP[i], cols[i]);
    }
}

const _aux_rows = Array.from({ length: MAT_RANK }, () => v3());
const _aux_cols = Array.from({ length: MAT_RANK }, () => v3());

const MUL3x3_MAP = range(MAT_SIZE, (idx) => idx2rowcol(idx));
export function mul3x3(lhs: Mat3, rhs: Mat3, out: Mat3Mut = m3()): Mat3 {
    takeRows(lhs, _aux_rows);
    takeCols(rhs, _aux_cols);
    for (let i = 0; i < MAT_SIZE; ++i) {
        const { row, col } = MUL3x3_MAP[i];
        out[i] = dot3(_aux_rows[row], _aux_cols[col]);
    }
    return out;
}

const _mul3v2_aux = v3();
export function mul3v2(lhs: Mat3, rhs: Vec2, out: Vec2Mut = vec2(0, 0) as Vec2Mut): Vec2 {
    const v = mul3v3(lhs, vec3(rhs.x, rhs.y, 1), _mul3v2_aux);
    return upd2(out, v.x / v.z, v.y / v.z);
}

export function mul3v3(lhs: Mat3, rhs: Vec3, out: Vec3Mut = v3()): Vec3 {
    takeRows(lhs, _aux_rows);
    return upd3(
        out,
        dot3(_aux_rows[0], rhs),
        dot3(_aux_rows[1], rhs),
        dot3(_aux_rows[2], rhs),
    );
}

function det2x2(mat: Mat3, indices: ReadonlyArray<number>): number {
    return mat[indices[0]] * mat[indices[3]] - mat[indices[2]] * mat[indices[1]];
}

const DET3X3_MAP = range(MAT_RANK, (col) => {
    return { sign: 1 - 2 * (col & 1), idx: rowcol2idx(0, col), indices: excludeRowCol(0, col) } as const;
});
export function det3x3(mat: Mat3): number {
    let sum = 0;
    for (let i = 0; i < DET3X3_MAP.length; ++i) {
        const { sign, idx, indices } = DET3X3_MAP[i];
        sum += sign * mat[idx] * det2x2(mat, indices);
    }
    return sum;
}

const ADJUGATE3X3_MAP = range(MAT_SIZE, (idx) => {
    const { row, col } = idx2rowcol(idx);
    return { sign: 1 - 2 * ((row + col) & 1), indices: excludeRowCol(col, row) } as const;
});
const _adjugate3x3_aux = m3();
export function adjugate3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    const aux = _adjugate3x3_aux;
    for (let i = 0; i < MAT_SIZE; ++i) {
        const { sign, indices } = ADJUGATE3X3_MAP[i];
        aux[i] = sign * det2x2(mat, indices);
    }
    return clone3x3(aux, out);
}

const _inverse3x3_aux = m3();
export function inverse3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    const aux = _inverse3x3_aux;
    let k = 1 / det3x3(mat);
    if (!Number.isFinite(k)) {
        k = 0;
    }
    adjugate3x3(mat, aux);
    for (let i = 0; i < MAT_SIZE; ++i) {
        aux[i] = aux[i] * k;
    }
    return clone3x3(aux, out);
}

const _apply3x3_aux = mat3();
export function apply3x3<T extends AnyFunc>(mat: Mat3Mut, func: T, ...args: SkipLastArg<T>): void {
    func(...args, _apply3x3_aux);
    mul3x3(_apply3x3_aux, mat, mat);
}

const TRANSLATION3X3_MAP = { x: rowcol2idx(0, 2), y: rowcol2idx(1, 2) } as const;
export function translation3x3(translation: Vec2, out: Mat3Mut = m3()): Mat3 {
    identity3x3(out);
    const { x, y } = TRANSLATION3X3_MAP;
    out[x] = translation.x;
    out[y] = translation.y;
    return out;
}

const ROTATION3X3_MAP = {
    xx: rowcol2idx(0, 0), xy: rowcol2idx(0, 1),
    yx: rowcol2idx(1, 0), yy: rowcol2idx(1, 1),
} as const;
export function rotation3x3(rotation: number, out: Mat3Mut = m3()): Mat3 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity3x3(out);
    const { xx, xy, yx, yy } = ROTATION3X3_MAP;
    out[xx] = +c;
    out[xy] = -s;
    out[yx] = +s;
    out[yy] = +c;
    return out;
}

const SCALING3X3_MAP = { x: rowcol2idx(0, 0), y: rowcol2idx(1, 1) } as const;
export function scaling3x3(scaling: Vec2, out: Mat3Mut = m3()): Mat3 {
    identity3x3(out);
    const { x, y } = SCALING3X3_MAP;
    out[x] = scaling.x;
    out[y] = scaling.y;
    return out;
}

export interface Projection3x3Options {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

const PROJECTION4X4_MAP = {
    xx: rowcol2idx(0, 0), yy: rowcol2idx(1, 1),
    xz: rowcol2idx(0, 2), yz: rowcol2idx(1, 2),
    zz: rowcol2idx(2, 2),
} as const;
export function projection3x3(options: Projection3x3Options, out: Mat3Mut = m3()): Mat3 {
    const { left, right, bottom, top } = options;
    const kx = 2 / (right - left);
    const ky = 2 / (top - bottom);
    const dx = -(left + right) / 2 * kx;
    const dy = -(bottom + top) / 2 * ky;
    zero3x3(out);
    const { xx, yy, xz, yz, zz } = PROJECTION4X4_MAP;
    out[xx] = kx;
    out[yy] = ky;
    out[xz] = dx;
    out[yz] = dy;
    out[zz] = 1;
    return out;
}
