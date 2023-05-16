import type { Mat3, Mat3Mut } from './mat3.types';
import type { Vec2, Vec2Mut } from './vec2.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import type { AnyFunc, SkipLastArg } from './helpers.types';
import { upd2 } from './vec2.helper';
import { vec2 } from './vec2';
import { upd3 } from './vec3.helper';
import { vec3 } from './vec3';
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
    return Array<number>(MAT_SIZE).fill(0);
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

const IDENTITY3X3_MAP = range(MAT_RANK, (i) => rowcol2idx(i, i));
export function identity3x3(out: Mat3Mut = m3()): Mat3 {
    zero3x3(out);
    for (const idx of IDENTITY3X3_MAP) {
        out[idx] = 1;
    }
    return out;
}

const UPDATE3X3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return rowcol2idx(col, row);
});
export function update3x3(values: ReadonlyArray<number>, out: Mat3Mut = m3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = values[UPDATE3X3_MAP[i]];
    }
    return out;
}

export function clone3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    if (mat === out) {
        return out;
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = mat[i];
    }
    return out;
}

const TRANSPOSE3X3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return row < col ? [idx, rowcol2idx(col, row)] : null;
});
export function transpose3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    clone3x3(mat, out);
    for (const [idx1, idx2] of TRANSPOSE3X3_MAP) {
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

const MUL3x3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return range(MAT_RANK, (k) => [rowcol2idx(row, k), rowcol2idx(k, col)]);
});
const _mul3x3_aux = mat3();
export function mul3x3(lhs: Mat3, rhs: Mat3, out: Mat3Mut = m3()): Mat3 {
    const aux = _mul3x3_aux as Mat3Mut;
    for (let i = 0; i < MAT_SIZE; ++i) {
        let val = 0;
        for (const [lidx, ridx] of MUL3x3_MAP[i]) {
            val += lhs[lidx] * rhs[ridx];
        }
        aux[i] = val;
    }
    return clone3x3(aux, out);
}

const _mul3v2_aux = vec3(0, 0, 0);
export function mul3v2(lhs: Mat3, rhs: Vec2, out: Vec2Mut = vec2(0, 0) as Vec2Mut): Vec2 {
    const v = mul3v3(lhs, vec3(rhs.x, rhs.y, 1), _mul3v2_aux as Vec3Mut);
    return upd2(out, v.x / v.z, v.y / v.z);
}

export function mul3v3(lhs: Mat3, rhs: Vec3, out: Vec3Mut = vec3(0, 0, 0) as Vec3Mut): Vec3 {
    const [
        a11, a21, a31,
        a12, a22, a32,
        a13, a23, a33,
    ] = lhs;
    const { x, y, z } = rhs;
    return upd3(out,
        a11 * x + a12 * y + a13 * z,
        a21 * x + a22 * y + a23 * z,
        a31 * x + a32 * y + a33 * z,
    );
}

function det2x2(mat: Mat3, indices: ReadonlyArray<number>): number {
    return mat[indices[0]] * mat[indices[3]] - mat[indices[2]] * mat[indices[1]];
}

const DET3X3_MAP = range(MAT_RANK, (col) =>
    [1 - 2 * (col & 1), rowcol2idx(0, col), excludeRowCol(0, col)] as [number, number, ReadonlyArray<number>],
);
export function det3x3(mat: Mat3): number {
    let sum = 0;
    for (let i = 0; i < DET3X3_MAP.length; ++i) {
        const [sign, idx, indices] = DET3X3_MAP[i];
        sum += sign * mat[idx] * det2x2(mat, indices);
    }
    return sum;
}

const ADJUGATE3X3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return [1 - 2 * ((row + col) & 1), excludeRowCol(col, row)] as [number, ReadonlyArray<number>];
});
const _adjugate3x3_aux = mat3();
export function adjugate3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    const aux = _adjugate3x3_aux as Mat3Mut;
    for (let i = 0; i < MAT_SIZE; ++i) {
        const [sign, indices] = ADJUGATE3X3_MAP[i];
        aux[i] = sign * det2x2(mat, indices);
    }
    return clone3x3(aux, out);
}

const _inverse3x3_aux = mat3();
export function inverse3x3(mat: Mat3, out: Mat3Mut = m3()): Mat3 {
    const aux = _inverse3x3_aux as Mat3Mut;
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

const TRANSLATION3X3_MAP = [rowcol2idx(0, 2), rowcol2idx(1, 2)] as const;
export function translation3x3(translation: Vec2, out: Mat3Mut = m3()): Mat3 {
    identity3x3(out);
    const [xidx, yidx] = TRANSLATION3X3_MAP;
    out[xidx] = translation.x;
    out[yidx] = translation.y;
    return out;
}

const ROTATION3X3_MAP = [
    rowcol2idx(0, 0), rowcol2idx(0, 1),
    rowcol2idx(1, 0), rowcol2idx(1, 1),
] as const;
export function rotation3x3(rotation: number, out: Mat3Mut = m3()): Mat3 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity3x3(out);
    const [xx, xy, yx, yy] = ROTATION3X3_MAP;
    out[xx] = +c;
    out[xy] = -s;
    out[yx] = +s;
    out[yy] = +c;
    return out;
}

const SCALING3X3_MAP = [rowcol2idx(0, 0), rowcol2idx(1, 1)] as const;
export function scaling3x3(scaling: Vec2, out: Mat3Mut = m3()): Mat3 {
    identity3x3(out);
    const [xidx, yidx] = SCALING3X3_MAP;
    out[xidx] = scaling.x;
    out[yidx] = scaling.y;
    return out;
}

export interface Projection3x3Options {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

const PROJECTION4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(1, 1),
    rowcol2idx(0, 2), rowcol2idx(1, 2),
    rowcol2idx(2, 2),
] as const;
export function projection3x3(options: Projection3x3Options, out: Mat3Mut = m3()): Mat3 {
    const { left, right, bottom, top } = options;
    const kx = 2 / (right - left);
    const ky = 2 / (top - bottom);
    const dx = -(left + right) / 2 * kx;
    const dy = -(bottom + top) / 2 * ky;
    zero3x3(out);
    const [xx, yy, xz, yz, zz] = PROJECTION4X4_MAP;
    out[xx] = kx;
    out[yy] = ky;
    out[xz] = dx;
    out[yz] = dy;
    out[zz] = 1;
    return out;
}
