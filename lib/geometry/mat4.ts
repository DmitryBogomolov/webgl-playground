import type { Mat4 } from './types/mat4';
import type { Vec3 } from './types/vec3';
import type { Vec4 } from './types/vec4';
import { vec3, norm3, sub3, cross3, dot3 } from './vec3';
import { vec4 } from './vec4';

const MAT_RANK = 4;
const MAT_SIZE = MAT_RANK ** 2;

export function isMat4(mat: unknown): mat is Mat4 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat4(): Mat4 {
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

export function eq4x4(lhs: Mat4, rhs: Mat4, eps: number = 1E-7): boolean {
    if (lhs === rhs) {
        return true;
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        if (Math.abs(lhs[i] - rhs[i]) > eps) {
            return false;
        }
    }
    return true;
}

export function zero4x4(out: Mat4 = mat4()): Mat4 {
    (out as number[]).fill(0);
    return out;
}

const IDENTITY4X4_MAP = range(MAT_RANK, (i) => rowcol2idx(i, i));
export function identity4x4(out: Mat4 = mat4()): Mat4 {
    zero4x4(out);
    for (const idx of IDENTITY4X4_MAP) {
        (out as number[])[idx] = 1;
    }
    return out;
}

const UPDATE4X4_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return rowcol2idx(col, row);
});
export function update4x4(values: ReadonlyArray<number>, out: Mat4 = mat4()): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = values[UPDATE4X4_MAP[i]];
    }
    return out;
}

export function clone4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    if (mat === out) {
        return out;
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = mat[i];
    }
    return out;
}

const TRANSPOSE4X4_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return row < col ? [idx, rowcol2idx(col, row)] as Pair : null;
});
export function transpose4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    clone4x4(mat, out);
    for (const [idx1, idx2] of TRANSPOSE4X4_MAP) {
        const tmp = out[idx1];
        (out as number[])[idx1] = out[idx2];
        (out as number[])[idx2] = tmp;
    }
    return out;
}

export function add4x4(lhs: Mat4, rhs: Mat4, out: Mat4 = mat4()): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = lhs[i] + rhs[i];
    }
    return out;
}

export function sub4x4(lhs: Mat4, rhs: Mat4, out: Mat4 = mat4()): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        (out as number[])[i] = lhs[i] - rhs[i];
    }
    return out;
}

const MUL4x4_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return range(MAT_RANK, (k) => [rowcol2idx(row, k), rowcol2idx(k, col)] as Pair);
});
const _mul4x4Aux = mat4() as number[];
export function mul4x4(lhs: Mat4, rhs: Mat4, out: Mat4 = mat4()): Mat4 {
    const aux = _mul4x4Aux;
    for (let i = 0; i < MAT_SIZE; ++i) {
        let val = 0;
        for (const [lidx, ridx] of MUL4x4_MAP[i]) {
            val += lhs[lidx] * rhs[ridx];
        }
        aux[i] = val;
    }
    return clone4x4(aux, out);
}

export function mul4v3(lhs: Mat4, rhs: Vec3): Vec3 {
    const v = mul4v4(lhs, vec4(rhs.x, rhs.y, rhs.z, 1));
    return vec3(v.x / v.w, v.y / v.w, v.z / v.w);
}

export function mul4v4(lhs: Mat4, rhs: Vec4): Vec4 {
    const [
        a11, a21, a31, a41,
        a12, a22, a32, a42,
        a13, a23, a33, a43,
        a14, a24, a34, a44,
    ] = lhs as number[];
    const { x, y, z, w } = rhs;
    return vec4(
        a11 * x + a12 * y + a13 * z + a14 * w,
        a21 * x + a22 * y + a23 * z + a24 * w,
        a31 * x + a32 * y + a33 * z + a34 * w,
        a41 * x + a42 * y + a43 * z + a44 * w,
    );
}

function det3x3(mat: Mat4, indices: ReadonlyArray<number>): number {
    return mat[indices[0]] * mat[indices[4]] * mat[indices[8]]
        - mat[indices[0]] * mat[indices[7]] * mat[indices[5]]
        - mat[indices[1]] * mat[indices[3]] * mat[indices[8]]
        + mat[indices[1]] * mat[indices[6]] * mat[indices[5]]
        + mat[indices[2]] * mat[indices[3]] * mat[indices[7]]
        - mat[indices[2]] * mat[indices[6]] * mat[indices[4]];
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

const DET4X4_MAP = range(MAT_RANK, (col) =>
    [1 - 2 * (col & 1), rowcol2idx(0, col), excludeRowCol(0, col)] as [number, number, ReadonlyArray<number>],
);
export function det4x4(mat: Mat4): number {
    let sum = 0;
    for (let i = 0; i < DET4X4_MAP.length; ++i) {
        const [sign, idx, indices] = DET4X4_MAP[i];
        sum += sign * mat[idx] * det3x3(mat, indices);
    }
    return sum;
}

const ADJUGATE4X4_MAP = range(MAT_SIZE, (idx) => {
    const [row, col] = idx2rowcol(idx);
    return [1 - 2 * ((row + col) & 1), excludeRowCol(col, row)] as [number, ReadonlyArray<number>];
});
const _adjugate4x4Aux = mat4() as number[];
export function adjugate4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    const aux = _adjugate4x4Aux;
    for (let i = 0; i < MAT_SIZE; ++i) {
        const [sign, indices] = ADJUGATE4X4_MAP[i];
        aux[i] = sign * det3x3(mat, indices);
    }
    return clone4x4(aux, out);
}

const _inverse4x4Aux = mat4() as number[];
export function inverse4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    const aux = _inverse4x4Aux;
    let k = 1 / det4x4(mat);
    if (!Number.isFinite(k)) {
        k = 0;
    }
    adjugate4x4(mat, aux);
    for (let i = 0; i < MAT_SIZE; ++i) {
        aux[i] = aux[i] * k;
    }
    return clone4x4(aux, out);
}

export function inversetranspose4x4(mat: Mat4, out: Mat4 = mat4()): Mat4 {
    inverse4x4(mat, out);
    transpose4x4(out, out);
    return out;
}

type SkipLast<T> = T extends [...args: infer P, last?: unknown] ? P : never;
const _apply4x4Aux = mat4() as number[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apply4x4<T extends (...args: any[]) => any>(
    mat: Mat4, func: T, ...args: SkipLast<Parameters<T>>
): void {
    func(...args, _apply4x4Aux);
    mul4x4(_apply4x4Aux, mat, mat);
}

const TRANSLATION4X4_MAP = [rowcol2idx(0, 3), rowcol2idx(1, 3), rowcol2idx(2, 3)] as const;
export function translation4x4(translation: Vec3, out: Mat4 = mat4()): Mat4 {
    identity4x4(out);
    const [xidx, yidx, zidx] = TRANSLATION4X4_MAP;
    (out as number[])[xidx] = translation.x;
    (out as number[])[yidx] = translation.y;
    (out as number[])[zidx] = translation.z;
    return out;
}

const SCALING4X4_MAP = [rowcol2idx(0, 0), rowcol2idx(1, 1), rowcol2idx(2, 2)] as const;
export function scaling4x4(scaling: Vec3, out: Mat4 = mat4()): Mat4 {
    identity4x4(out);
    const [xidx, yidx, zidx] = SCALING4X4_MAP;
    (out as number[])[xidx] = scaling.x;
    (out as number[])[yidx] = scaling.y;
    (out as number[])[zidx] = scaling.z;
    return out;
}

const ROTATION4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(0, 1), rowcol2idx(0, 2),
    rowcol2idx(1, 0), rowcol2idx(1, 1), rowcol2idx(1, 2),
    rowcol2idx(2, 0), rowcol2idx(2, 1), rowcol2idx(2, 2),
    rowcol2idx(3, 3),
] as const;
export function rotation4x4(axis: Vec3, rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const t = 1 - c;
    const { x, y, z } = norm3(axis);
    zero4x4(out);
    const [xx, xy, xz, yx, yy, yz, zx, zy, zz, ww] = ROTATION4X4_MAP;
    (out as number[])[xx] = x * x * t + c;
    (out as number[])[xy] = x * y * t - z * s;
    (out as number[])[xz] = x * z * t + y * s;
    (out as number[])[yx] = y * x * t + z * s;
    (out as number[])[yy] = y * y * t + c;
    (out as number[])[yz] = y * z * t - x * s;
    (out as number[])[zx] = z * x * t - y * s;
    (out as number[])[zy] = z * y * t + x * s;
    (out as number[])[zz] = z * z * t + c;
    (out as number[])[ww] = 1;
    return out;
}

const XROTATION4X4_MAP = [
    rowcol2idx(1, 1), rowcol2idx(1, 2),
    rowcol2idx(2, 1), rowcol2idx(2, 2),
] as const;
export function xrotation4x4(rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity4x4(out);
    const [yy, yz, zy, zz] = XROTATION4X4_MAP;
    (out as number[])[yy] = +c;
    (out as number[])[yz] = -s;
    (out as number[])[zy] = +s;
    (out as number[])[zz] = +c;
    return out;
}

const YROTATION4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(0, 2),
    rowcol2idx(2, 0), rowcol2idx(2, 2),
] as const;
export function yrotation4x4(rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity4x4(out);
    const [xx, xz, zx, zz] = YROTATION4X4_MAP;
    (out as number[])[xx] = +c;
    (out as number[])[xz] = +s;
    (out as number[])[zx] = -s;
    (out as number[])[zz] = +c;
    return out;
}

const ZROTATION4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(0, 1),
    rowcol2idx(1, 0), rowcol2idx(1, 1),
] as const;
export function zrotation4x4(rotation: number, out: Mat4 = mat4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity4x4(out);
    const [xx, xy, yx, yy] = ZROTATION4X4_MAP;
    (out as number[])[xx] = +c;
    (out as number[])[xy] = -s;
    (out as number[])[yx] = +s;
    (out as number[])[yy] = +c;
    return out;
}

export interface Orthogrpahic4x4Options {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly zNear: number;
    readonly zFar: number;
}

const ORTHOGRAPHIC4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(1, 1), rowcol2idx(2, 2), rowcol2idx(3, 3),
    rowcol2idx(0, 3), rowcol2idx(1, 3), rowcol2idx(2, 3),
] as const;
export function orthographic4x4(
    { left, right, bottom, top, zNear, zFar }: Orthogrpahic4x4Options, out: Mat4 = mat4(),
): Mat4 {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (zNear - zFar);
    zero4x4(out);
    const [xx, yy, zz, ww, xw, yw, zw] = ORTHOGRAPHIC4X4_MAP;
    (out as number[])[xx] = -2 * lr;
    (out as number[])[yy] = -2 * bt;
    (out as number[])[zz] = 2 * nf;
    (out as number[])[ww] = 1;
    (out as number[])[xw] = (left + right) * lr;
    (out as number[])[yw] = (bottom + top) * bt;
    (out as number[])[zw] = (zNear + zFar) * nf;
    return out;
}

export interface Perspective4x4Options {
    readonly yFov: number;
    readonly aspect: number;
    readonly zNear: number;
    readonly zFar: number;
}

const PERSPECTIVE4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(1, 1), rowcol2idx(2, 2),
    rowcol2idx(2, 3), rowcol2idx(3, 2),
] as const;
export function perspective4x4(
    { yFov, aspect, zNear, zFar }: Perspective4x4Options, out: Mat4 = mat4(),
): Mat4 {
    const f = 1 / Math.tan(yFov / 2);
    let p = -1;
    let q = -2 * zNear;
    if (Number.isFinite(zFar)) {
        const nf = 1 / (zNear - zFar);
        p = (zNear + zFar) * nf;
        q = 2 * zFar * zNear * nf;
    }
    zero4x4(out);
    const [xx, yy, zz, zw, wz] = PERSPECTIVE4X4_MAP;
    (out as number[])[xx] = f / aspect;
    (out as number[])[yy] = f;
    (out as number[])[zz] = p;
    (out as number[])[zw] = q;
    (out as number[])[wz] = -1;
    return out;
}

export interface LookAt4x4Options {
    readonly eye: Vec3;
    readonly center: Vec3;
    readonly up: Vec3;
}

const LOOKAT4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(0, 1), rowcol2idx(0, 2),
    rowcol2idx(1, 0), rowcol2idx(1, 1), rowcol2idx(1, 2),
    rowcol2idx(2, 0), rowcol2idx(2, 1), rowcol2idx(2, 2),
    rowcol2idx(0, 3), rowcol2idx(1, 3), rowcol2idx(2, 3),
    rowcol2idx(3, 3),
] as const;
export function lookAt4x4(
    { eye, center, up }: LookAt4x4Options, out: Mat4 = mat4(),
): Mat4 {
    const zAxis = norm3(sub3(eye, center));
    const xAxis = norm3(cross3(up, zAxis));
    const yAxis = cross3(zAxis, xAxis);
    zero4x4(out);
    const [
        xx, xy, xz,
        yx, yy, yz,
        zx, zy, zz,
        xw, yw, zw,
        ww,
    ] = LOOKAT4X4_MAP;
    (out as number[])[xx] = xAxis.x;
    (out as number[])[xy] = xAxis.y;
    (out as number[])[xz] = xAxis.z;
    (out as number[])[yx] = yAxis.x;
    (out as number[])[yy] = yAxis.y;
    (out as number[])[yz] = yAxis.z;
    (out as number[])[zx] = zAxis.x;
    (out as number[])[zy] = zAxis.y;
    (out as number[])[zz] = zAxis.z;
    (out as number[])[xw] = -dot3(xAxis, eye);
    (out as number[])[yw] = -dot3(yAxis, eye);
    (out as number[])[zw] = -dot3(zAxis, eye);
    (out as number[])[ww] = 1;
    return out;
}

export interface TargetTo4x4Options {
    readonly eye: Vec3;
    readonly target: Vec3;
    readonly up: Vec3;
}

const TARGET4X4_MAP = [
    rowcol2idx(0, 0), rowcol2idx(1, 0), rowcol2idx(2, 0),
    rowcol2idx(0, 1), rowcol2idx(1, 1), rowcol2idx(2, 1),
    rowcol2idx(0, 2), rowcol2idx(1, 2), rowcol2idx(2, 2),
    rowcol2idx(0, 3), rowcol2idx(1, 3), rowcol2idx(2, 3),
    rowcol2idx(3, 3),
] as const;
export function targetTo4x4(
    { eye, target, up }: TargetTo4x4Options, out: Mat4 = mat4(),
): Mat4 {
    const zAxis = norm3(sub3(eye, target));
    const xAxis = cross3(norm3(up), zAxis);
    const yAxis = cross3(zAxis, xAxis);
    zero4x4(out);
    const [
        xx, xy, xz,
        yx, yy, yz,
        zx, zy, zz,
        xw, yw, zw,
        ww,
    ] = TARGET4X4_MAP;
    (out as number[])[xx] = xAxis.x;
    (out as number[])[xy] = xAxis.y;
    (out as number[])[xz] = xAxis.z;
    (out as number[])[yx] = yAxis.x;
    (out as number[])[yy] = yAxis.y;
    (out as number[])[yz] = yAxis.z;
    (out as number[])[zx] = zAxis.x;
    (out as number[])[zy] = zAxis.y;
    (out as number[])[zz] = zAxis.z;
    (out as number[])[xw] = eye.x;
    (out as number[])[yw] = eye.y;
    (out as number[])[zw] = eye.z;
    (out as number[])[ww] = 1;
    return out;
}
