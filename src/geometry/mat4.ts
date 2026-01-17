import type {
    Mat4, Mat4Mut,
    Orthogrpahic4x4Options, Perspective4x4Options, Frustum4x4Options, LookAt4x4Options, TargetTo4x4Options,
} from './mat4.types';
import type { Vec3, Vec3Mut } from './vec3.types';
import type { Vec4, Vec4Mut } from './vec4.types';
import type { AnyFunc, SkipLastArg } from './helpers.types';
import { upd3 } from './vec3.helper';
import { vec3, norm3, sub3, cross3, dot3 } from './vec3';
import { upd4 } from './vec4.helper';
import { vec4, dot4 } from './vec4';
import { floatEq as eq, FLOAT_EQ_EPS } from './float-eq';
import { range, rowcol2idxRank, idx2rowcolRank, excludeRowColRank } from './helpers';

const MAT_RANK = 4;
const MAT_SIZE = MAT_RANK ** 2;

const rowcol2idx = rowcol2idxRank.bind(null, MAT_RANK);
const idx2rowcol = idx2rowcolRank.bind(null, MAT_RANK);
const excludeRowCol = excludeRowColRank.bind(null, MAT_RANK);

export function isMat4(mat: unknown): mat is Mat4 {
    return Array.isArray(mat) && mat.length === MAT_SIZE;
}

export function mat4(): Mat4 {
    return Array.from({ length: MAT_SIZE }, () => 0) as unknown as Mat4;
}

export function eq4x4(lhs: Mat4, rhs: Mat4, eps: number = FLOAT_EQ_EPS): boolean {
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

function m4(): Mat4Mut {
    return mat4() as Mat4Mut;
}

export function zero4x4(out: Mat4Mut = m4()): Mat4 {
    (out as unknown as number[]).fill(0);
    return out;
}

const IDENTITY4X4_MAP = range(MAT_RANK, (i) => rowcol2idx(i, i));
export function identity4x4(out: Mat4Mut = m4()): Mat4 {
    zero4x4(out);
    for (const idx of IDENTITY4X4_MAP) {
        out[idx] = 1;
    }
    return out;
}

export function update4x4(values: ArrayLike<number>, out: Mat4Mut = m4()): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = values[i];
    }
    return out;
}

export function clone4x4(mat: Mat4, out: Mat4Mut = m4()): Mat4 {
    if (mat === out) {
        return out;
    }
    return update4x4(mat, out);
}

function v3(): Vec3Mut {
    return vec3(0, 0, 0) as Vec3Mut;
}

function v4(): Vec4Mut {
    return vec4(0, 0, 0, 0) as Vec4Mut;
}

function takeVec4(mat: Mat4, indices: ArrayLike<number>, v: Vec4Mut): void {
    upd4(v, mat[indices[0]], mat[indices[1]], mat[indices[2]], mat[indices[3]]);
}

const ROWS_MAP = range(MAT_RANK, (row) => range(MAT_RANK, (k) => rowcol2idx(row, k)));
export function mat4row(mat: Mat4, row: number, out: Vec4Mut = v4()): Vec4 {
    takeVec4(mat, ROWS_MAP[row], out);
    return out;
}

const COLS_MAP = range(MAT_RANK, (col) => range(MAT_RANK, (k) => rowcol2idx(k, col)));
export function mat4col(mat: Mat4, col: number, out: Vec4Mut = v4()): Vec4 {
    takeVec4(mat, COLS_MAP[col], out);
    return out;
}

const TRANSPOSE4X4_MAP = range(MAT_SIZE, (idx) => {
    const { row, col } = idx2rowcol(idx);
    return row < col ? { idx1: idx, idx2: rowcol2idx(col, row) } as const : null;
});
export function transpose4x4(mat: Mat4, out: Mat4Mut = m4()): Mat4 {
    clone4x4(mat, out);
    for (const { idx1, idx2 } of TRANSPOSE4X4_MAP) {
        const tmp = out[idx1];
        out[idx1] = out[idx2];
        out[idx2] = tmp;
    }
    return out;
}

export function add4x4(lhs: Mat4, rhs: Mat4, out: Mat4Mut = m4()): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = lhs[i] + rhs[i];
    }
    return out;
}

export function sub4x4(lhs: Mat4, rhs: Mat4, out: Mat4Mut = m4()): Mat4 {
    for (let i = 0; i < MAT_SIZE; ++i) {
        out[i] = lhs[i] - rhs[i];
    }
    return out;
}

const MUL4x4_MAP = range(MAT_SIZE, (idx) => idx2rowcol(idx));
const _mul4x4_aux_rows = Array.from({ length: MAT_RANK }, () => v4());
const _mul4x4_aux_cols = Array.from({ length: MAT_RANK }, () => v4());
export function mul4x4(lhs: Mat4, rhs: Mat4, out: Mat4Mut = m4()): Mat4 {
    const rows = _mul4x4_aux_rows;
    const cols = _mul4x4_aux_cols;
    for (let i = 0; i < MAT_RANK; ++i) {
        mat4row(lhs, i, rows[i]);
        mat4col(rhs, i, cols[i]);
    }
    for (let i = 0; i < MAT_SIZE; ++i) {
        const { row, col } = MUL4x4_MAP[i];
        out[i] = dot4(rows[row], cols[col]);
    }
    return out;
}

const _mul4v3_aux = v4();
export function mul4v3(lhs: Mat4, rhs: Vec3, out: Vec3Mut = v3()): Vec3 {
    const v = mul4v4(lhs, vec4(rhs.x, rhs.y, rhs.z, 1), _mul4v3_aux);
    return upd3(out, v.x / v.w, v.y / v.w, v.z / v.w);
}

export function mul4v4(lhs: Mat4, rhs: Vec4, out: Vec4Mut = v4()): Vec4 {
    const x = dot4(mat4row(lhs, 0, out), rhs);
    const y = dot4(mat4row(lhs, 1, out), rhs);
    const z = dot4(mat4row(lhs, 2, out), rhs);
    const w = dot4(mat4row(lhs, 3, out), rhs);
    return upd4(out, x, y, z, w);
}

function det3x3(mat: Mat4, indices: ArrayLike<number>): number {
    return mat[indices[0]] * mat[indices[4]] * mat[indices[8]]
        - mat[indices[0]] * mat[indices[7]] * mat[indices[5]]
        - mat[indices[1]] * mat[indices[3]] * mat[indices[8]]
        + mat[indices[1]] * mat[indices[6]] * mat[indices[5]]
        + mat[indices[2]] * mat[indices[3]] * mat[indices[7]]
        - mat[indices[2]] * mat[indices[6]] * mat[indices[4]];
}

const DET4X4_MAP = range(MAT_RANK, (col) => {
    return { sign: 1 - 2 * (col & 1), idx: rowcol2idx(0, col), indices: excludeRowCol(0, col) } as const;
});
export function det4x4(mat: Mat4): number {
    let sum = 0;
    for (let i = 0; i < DET4X4_MAP.length; ++i) {
        const { sign, idx, indices } = DET4X4_MAP[i];
        sum += sign * mat[idx] * det3x3(mat, indices);
    }
    return sum;
}

const ADJUGATE4X4_MAP = range(MAT_SIZE, (idx) => {
    const { row, col } = idx2rowcol(idx);
    return { sign: 1 - 2 * ((row + col) & 1), indices: excludeRowCol(col, row) } as const;
});
const _adjugate4x4_aux = m4();
export function adjugate4x4(mat: Mat4, out: Mat4Mut = m4()): Mat4 {
    const aux = _adjugate4x4_aux;
    for (let i = 0; i < MAT_SIZE; ++i) {
        const { sign, indices } = ADJUGATE4X4_MAP[i];
        aux[i] = sign * det3x3(mat, indices);
    }
    return clone4x4(aux, out);
}

const _inverse4x4_aux = m4();
export function inverse4x4(mat: Mat4, out: Mat4Mut = m4()): Mat4 {
    const aux = _inverse4x4_aux;
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

export function inversetranspose4x4(mat: Mat4, out: Mat4Mut = m4()): Mat4 {
    inverse4x4(mat, out);
    transpose4x4(out, out);
    return out;
}

const _apply4x4_aux = m4();
export function apply4x4<T extends AnyFunc>(mat: Mat4Mut, func: T, ...args: SkipLastArg<T>): void {
    func(...args, _apply4x4_aux);
    mul4x4(_apply4x4_aux, mat, mat);
}

const TRANSLATION4X4_MAP = { x: rowcol2idx(0, 3), y: rowcol2idx(1, 3), z: rowcol2idx(2, 3) } as const;
export function translation4x4(translation: Vec3, out: Mat4Mut = m4()): Mat4 {
    identity4x4(out);
    const { x, y, z } = TRANSLATION4X4_MAP;
    out[x] = translation.x;
    out[y] = translation.y;
    out[z] = translation.z;
    return out;
}

const SCALING4X4_MAP = { x: rowcol2idx(0, 0), y: rowcol2idx(1, 1), z: rowcol2idx(2, 2) } as const;
export function scaling4x4(scaling: Vec3, out: Mat4Mut = m4()): Mat4 {
    identity4x4(out);
    const { x, y, z } = SCALING4X4_MAP;
    out[x] = scaling.x;
    out[y] = scaling.y;
    out[z] = scaling.z;
    return out;
}

const ROTATION4X4_MAP = {
    xx: rowcol2idx(0, 0), xy: rowcol2idx(0, 1), xz: rowcol2idx(0, 2),
    yx: rowcol2idx(1, 0), yy: rowcol2idx(1, 1), yz: rowcol2idx(1, 2),
    zx: rowcol2idx(2, 0), zy: rowcol2idx(2, 1), zz: rowcol2idx(2, 2),
    ww: rowcol2idx(3, 3),
} as const;
const _rotation4x4_aux = v3();
export function rotation4x4(axis: Vec3, rotation: number, out: Mat4Mut = m4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const t = 1 - c;
    const { x, y, z } = norm3(axis, _rotation4x4_aux);
    zero4x4(out);
    const { xx, xy, xz, yx, yy, yz, zx, zy, zz, ww } = ROTATION4X4_MAP;
    out[xx] = x * x * t + c;
    out[xy] = x * y * t - z * s;
    out[xz] = x * z * t + y * s;
    out[yx] = y * x * t + z * s;
    out[yy] = y * y * t + c;
    out[yz] = y * z * t - x * s;
    out[zx] = z * x * t - y * s;
    out[zy] = z * y * t + x * s;
    out[zz] = z * z * t + c;
    out[ww] = 1;
    return out;
}

const XROTATION4X4_MAP = {
    yy: rowcol2idx(1, 1), yz: rowcol2idx(1, 2),
    zy: rowcol2idx(2, 1), zz: rowcol2idx(2, 2),
} as const;
export function xrotation4x4(rotation: number, out: Mat4Mut = m4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity4x4(out);
    const { yy, yz, zy, zz } = XROTATION4X4_MAP;
    out[yy] = +c;
    out[yz] = -s;
    out[zy] = +s;
    out[zz] = +c;
    return out;
}

const YROTATION4X4_MAP = {
    xx: rowcol2idx(0, 0), xz: rowcol2idx(0, 2),
    zx: rowcol2idx(2, 0), zz: rowcol2idx(2, 2),
} as const;
export function yrotation4x4(rotation: number, out: Mat4Mut = m4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity4x4(out);
    const { xx, xz, zx, zz } = YROTATION4X4_MAP;
    out[xx] = +c;
    out[xz] = +s;
    out[zx] = -s;
    out[zz] = +c;
    return out;
}

const ZROTATION4X4_MAP = {
    xx: rowcol2idx(0, 0), xy: rowcol2idx(0, 1),
    yx: rowcol2idx(1, 0), yy: rowcol2idx(1, 1),
} as const;
export function zrotation4x4(rotation: number, out: Mat4Mut = m4()): Mat4 {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    identity4x4(out);
    const { xx, xy, yx, yy } = ZROTATION4X4_MAP;
    out[xx] = +c;
    out[xy] = -s;
    out[yx] = +s;
    out[yy] = +c;
    return out;
}

const ORTHOGRAPHIC4X4_MAP = {
    xx: rowcol2idx(0, 0), yy: rowcol2idx(1, 1), zz: rowcol2idx(2, 2), ww: rowcol2idx(3, 3),
    xw: rowcol2idx(0, 3), yw: rowcol2idx(1, 3), zw: rowcol2idx(2, 3),
} as const;
export function orthographic4x4(options: Orthogrpahic4x4Options, out: Mat4Mut = m4()): Mat4 {
    const { left, right, bottom, top, zNear, zFar } = options;
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (zNear - zFar);
    zero4x4(out);
    const { xx, yy, zz, ww, xw, yw, zw } = ORTHOGRAPHIC4X4_MAP;
    out[xx] = -2 * lr;
    out[yy] = -2 * bt;
    out[zz] = 2 * nf;
    out[ww] = 1;
    out[xw] = (left + right) * lr;
    out[yw] = (bottom + top) * bt;
    out[zw] = (zNear + zFar) * nf;
    return out;
}

const PERSPECTIVE4X4_MAP = {
    xx: rowcol2idx(0, 0), yy: rowcol2idx(1, 1), zz: rowcol2idx(2, 2),
    zw: rowcol2idx(2, 3), wz: rowcol2idx(3, 2),
} as const;
export function perspective4x4(options: Perspective4x4Options, out: Mat4Mut = m4()): Mat4 {
    const { yFov, aspect, zNear, zFar } = options;
    const f = 1 / Math.tan(yFov / 2);
    let p = -1;
    let q = -2 * zNear;
    if (Number.isFinite(zFar)) {
        const nf = 1 / (zNear - zFar);
        p = (zNear + zFar) * nf;
        q = 2 * zFar * zNear * nf;
    }
    zero4x4(out);
    const { xx, yy, zz, zw, wz } = PERSPECTIVE4X4_MAP;
    out[xx] = f / aspect;
    out[yy] = f;
    out[zz] = p;
    out[zw] = q;
    out[wz] = -1;
    return out;
}

const FRUSTUM4X4_MAP = {
    xx: rowcol2idx(0, 0), yy: rowcol2idx(1, 1), zz: rowcol2idx(2, 2),
    xz: rowcol2idx(0, 2), yz: rowcol2idx(1, 2), zw: rowcol2idx(2, 3), wz: rowcol2idx(3, 2),
} as const;
export function frustum4x4(options: Frustum4x4Options, out: Mat4Mut = m4()): Mat4 {
    const { left, right, bottom, top, zNear, zFar } = options;
    const rl = 1 / (right - left);
    const tb = 1 / (top - bottom);
    const nf = 1 / (zNear - zFar);
    zero4x4(out);
    const { xx, yy, zz, xz, yz, zw, wz } = FRUSTUM4X4_MAP;
    out[xx] = 2 * zNear * rl;
    out[yy] = 2 * zNear * tb;
    out[zz] = (zNear + zFar) * nf;
    out[xz] = (right + left) * rl;
    out[yz] = (top + bottom) * tb;
    out[zw] = 2 * zNear * zFar * nf;
    out[wz] = -1;
    return out;
}

const LOOKAT4X4_MAP = {
    xx: rowcol2idx(0, 0), xy: rowcol2idx(0, 1), xz: rowcol2idx(0, 2),
    yx: rowcol2idx(1, 0), yy: rowcol2idx(1, 1), yz: rowcol2idx(1, 2),
    zx: rowcol2idx(2, 0), zy: rowcol2idx(2, 1), zz: rowcol2idx(2, 2),
    xw: rowcol2idx(0, 3), yw: rowcol2idx(1, 3), zw: rowcol2idx(2, 3),
    ww: rowcol2idx(3, 3),
} as const;
const _lookAt4x4_aux_x = v3();
const _lookAt4x4_aux_y = v3();
const _lookAt4x4_aux_z = v3();
export function lookAt4x4(options: LookAt4x4Options, out: Mat4Mut = m4()): Mat4 {
    const { eye, center, up } = options;
    const zAxis = norm3(sub3(eye, center, _lookAt4x4_aux_z), _lookAt4x4_aux_z);
    const xAxis = norm3(cross3(up, zAxis, _lookAt4x4_aux_x), _lookAt4x4_aux_x);
    const yAxis = cross3(zAxis, xAxis, _lookAt4x4_aux_y);
    zero4x4(out);
    const {
        xx, xy, xz,
        yx, yy, yz,
        zx, zy, zz,
        xw, yw, zw,
        ww,
    } = LOOKAT4X4_MAP;
    out[xx] = xAxis.x;
    out[xy] = xAxis.y;
    out[xz] = xAxis.z;
    out[yx] = yAxis.x;
    out[yy] = yAxis.y;
    out[yz] = yAxis.z;
    out[zx] = zAxis.x;
    out[zy] = zAxis.y;
    out[zz] = zAxis.z;
    out[xw] = -dot3(xAxis, eye);
    out[yw] = -dot3(yAxis, eye);
    out[zw] = -dot3(zAxis, eye);
    out[ww] = 1;
    return out;
}

const TARGET4X4_MAP = {
    xx: rowcol2idx(0, 0), xy: rowcol2idx(1, 0), xz: rowcol2idx(2, 0),
    yx: rowcol2idx(0, 1), yy: rowcol2idx(1, 1), yz: rowcol2idx(2, 1),
    zx: rowcol2idx(0, 2), zy: rowcol2idx(1, 2), zz: rowcol2idx(2, 2),
    xw: rowcol2idx(0, 3), yw: rowcol2idx(1, 3), zw: rowcol2idx(2, 3),
    ww: rowcol2idx(3, 3),
} as const;
const _targetTo4x4_aux_x = v3();
const _targetTo4x4_aux_y = v3();
const _targetTo4x4_aux_z = v3();
export function targetTo4x4(options: TargetTo4x4Options, out: Mat4Mut = m4()): Mat4 {
    const { eye, target, up } = options;
    const zAxis = norm3(sub3(eye, target, _targetTo4x4_aux_z), _targetTo4x4_aux_z);
    const xAxis = cross3(norm3(up, _targetTo4x4_aux_x), zAxis, _targetTo4x4_aux_x);
    const yAxis = cross3(zAxis, xAxis, _targetTo4x4_aux_y);
    zero4x4(out);
    const {
        xx, xy, xz,
        yx, yy, yz,
        zx, zy, zz,
        xw, yw, zw,
        ww,
    } = TARGET4X4_MAP;
    out[xx] = xAxis.x;
    out[xy] = xAxis.y;
    out[xz] = xAxis.z;
    out[yx] = yAxis.x;
    out[yy] = yAxis.y;
    out[yz] = yAxis.z;
    out[zx] = zAxis.x;
    out[zy] = zAxis.y;
    out[zz] = zAxis.z;
    out[xw] = eye.x;
    out[yw] = eye.y;
    out[zw] = eye.z;
    out[ww] = 1;
    return out;
}
