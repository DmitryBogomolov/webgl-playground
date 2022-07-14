import { vec2, Vec2 } from './vec2';
import { Vec3, vec3 } from './vec3';

export interface Mat3 {
    readonly [i: number]: number;
}

const MAT_RANK = 3;
const MAT_SIZE = MAT_RANK ** 2;

export function isMat3(mat: unknown): mat is Mat3 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat3(): Mat3 {
    return Array<number>(MAT_SIZE).fill(0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function range<T extends (idx: number) => any>(
    size: number, func: T,
): ReadonlyArray<NonNullable<ReturnType<T>>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array<number>(size).fill(0).map((_, i) => func(i)).filter((t) => t !== null);
}

type Pair = [number, number];

function rowcol2idx(row: number, col: number): number {
    return col * MAT_RANK + row;
}

function idx2rowcol(idx: number): Pair {
    return [idx % MAT_RANK, (idx / MAT_RANK) | 0];
}

export function zero3x3(out: Mat3 = mat3()): Mat3 {
    (out as number[]).fill(0);
    return out;
}

const IDENTITY3X3_MAP = range(MAT_RANK, (i) => rowcol2idx(i, i));
export function identity3x3(out: Mat3 = mat3()): Mat3 {
    zero3x3(out);
    for (const idx of IDENTITY3X3_MAP) {
        (out as number[])[idx] = 1;
    }
    return out;
}

const UPDATE3X3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return rowcol2idx(col, row);
});
export function update3x3(values: ReadonlyArray<number>, out: Mat3 = mat3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = values[UPDATE3X3_MAP[i]];
    }
    return out;
}

export function clone3x3(mat: Mat3, out: Mat3 = mat3()): Mat3 {
    if (mat === out) {
        return out;
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = mat[i];
    }
    return out;
}

const TRANSPOSE3X3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return row < col ? [idx, rowcol2idx(col, row)] as Pair : null;
});
export function transpose3x3(mat: Mat3, out: Mat3 = mat3()): Mat3 {
    clone3x3(mat, out);
    for (const [idx1, idx2] of TRANSPOSE3X3_MAP) {
        const tmp = out[idx1];
        (out as number[])[idx1] = out[idx2];
        (out as number[])[idx2] = tmp;
    }
    return out;
}

export function add3x3(lhs: Mat3, rhs: Mat3, out: Mat3 = mat3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = lhs[i] + rhs[i];
    }
    return out;
}

export function sub3x3(lhs: Mat3, rhs: Mat3, out: Mat3 = mat3()): Mat3 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = lhs[i] - rhs[i];
    }
    return out;
}

const MUL3x3_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return range(MAT_RANK, (k) => [rowcol2idx(row, k), rowcol2idx(k, col)] as Pair);
});
const _mul3x3Aux = mat3() as number[];
export function mul3x3(lhs: Mat3, rhs: Mat3, out: Mat3 = mat3()): Mat3 {
    const aux = _mul3x3Aux;
    for (let i = 0; i < MAT_SIZE; ++i) {
        let val = 0;
        for (const [lidx, ridx] of MUL3x3_MAP[i]) {
            val += lhs[lidx] * rhs[ridx];
        }
        aux[i] = val;
    }
    return clone3x3(aux, out);
}

export function mul3v2(lhs: Mat3, rhs: Vec2): Vec2 {
    const v = mul3v3(lhs, vec3(rhs.x, rhs.y, 1));
    return vec2(v.x / v.z, v.y / v.z);
}

export function mul3v3(lhs: Mat3, rhs: Vec3): Vec3 {
    const [
        a11, a21, a31,
        a12, a22, a32,
        a13, a23, a33,
    ] = lhs as number[];
    const { x, y, z } = rhs;
    return vec3(
        a11 * x + a12 * y + a13 * z,
        a21 * x + a22 * y + a23 * z,
        a31 * x + a32 * y + a33 * z,
    );
}

function det2x2(mat: Mat3, indices: ReadonlyArray<number>): number {
    return mat[indices[0]] * mat[indices[3]] - mat[indices[2]] * mat[indices[1]];
}

function excludeRowCol(row: number, col: number): number[] {
    const ret = Array<number>((MAT_RANK - 1) ** 2);
    let k = 0;
    for (let i = 0; i < MAT_RANK; ++i) {
        if (i === row) {
            continue;
        }
        for (let j = 0; j < MAT_RANK; ++j) {
            if (j === col) {
                continue;
            }
            ret[k++] = rowcol2idx(i, j);
        }
    }
    return ret;
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
const _adjugate3x3Aux = mat3() as number[];
export function adjugate3x3(mat: Mat3, out: Mat3 = mat3()): Mat3 {
    const aux = _adjugate3x3Aux;
    for (let i = 0; i < MAT_SIZE; ++i) {
        const [sign, indices] = ADJUGATE3X3_MAP[i];
        aux[i] = sign * det2x2(mat, indices);
    }
    return clone3x3(aux, out);
}

const _inverse3x3Aux = mat3() as number[];
export function inverse3x3(mat: Mat3, out: Mat3 = mat3()): Mat3 {
    const aux = _inverse3x3Aux;
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

const TRANSLATION3X3_MAP = [rowcol2idx(0, 2), rowcol2idx(1, 2)] as const;
export function translation3x3(translation: Vec2, out: Mat3 = mat3()): Mat3 {
    identity3x3(out);
    const [xidx, yidx] = TRANSLATION3X3_MAP;
    (out as number[])[xidx] = translation.x;
    (out as number[])[yidx] = translation.y;
    return out;
}

const ROTATION3X3_MAP = [
    rowcol2idx(0, 0), rowcol2idx(0, 1),
    rowcol2idx(1, 0), rowcol2idx(1, 1),
] as const;
export function rotation3x3(rotation: number, out: Mat3 = mat3()): Mat3 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity3x3(out);
    const [xx, xy, yx, yy] = ROTATION3X3_MAP;
    (out as number[])[xx] = +c;
    (out as number[])[xy] = -s;
    (out as number[])[yx] = +s;
    (out as number[])[yy] = +c;
    return out;
}

const SCALING3X3_MAP = [rowcol2idx(0, 0), rowcol2idx(1, 1)] as const;
export function scaling3x3(scaling: Vec2, out: Mat3 = mat3()): Mat3 {
    identity3x3(out);
    const [xidx, yidx] = SCALING3X3_MAP;
    (out as number[])[xidx] = scaling.x;
    (out as number[])[yidx] = scaling.y;
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
export function projection3x3(
    { left, right, bottom, top }: Projection3x3Options, out: Mat3 = mat3(),
): Mat3 {
    const kx = 2 / (right - left);
    const ky = 2 / (top - bottom);
    const dx = -(left + right) / 2 * kx;
    const dy = -(bottom + top) / 2 * ky;
    zero3x3(out);
    const [xx, yy, xz, yz, zz] = PROJECTION4X4_MAP;
    (out as number[])[xx] = kx;
    (out as number[])[yy] = ky;
    (out as number[])[xz] = dx;
    (out as number[])[yz] = dy;
    (out as number[])[zz] = 1;
    return out;
}
