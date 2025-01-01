import type { Vec3, Vec3Mut } from '../geometry/vec3.types';
import type { Mat4Mut } from '../geometry/mat4.types';
import type { EventProxy } from './event-emitter.types';
import { ZERO3, YUNIT3, ZUNIT3, vec3, isVec3, eq3, clone3, norm3, dist3, cross3 } from '../geometry/vec3';
import { mat4, identity4x4, mul4v3 } from '../geometry/mat4';
import { ViewProj } from './view-proj';
import { toArgStr } from '../utils/string-formatter';
import { EventEmitter } from './event-emitter';
import { rowcol2idxRank } from '../geometry/helpers';

export class OrbitCamera {
    private readonly _changed = new EventEmitter();
    private readonly _viewProj = new ViewProj();
    private readonly _rotationMat = mat4();
    private _originDir: Vec3 = clone3(ZUNIT3);
    private _upDir: Vec3 = clone3(YUNIT3);
    private _centerPos: Vec3 = clone3(ZERO3);

    changed(): EventProxy {
        return this._changed.proxy();
    }

    getOriginDir(): Vec3 {
        return this._originDir;
    }

    getUpDir(): Vec3 {
        return this._upDir;
    }

    setOrientation(originDir: Vec3, upDir: Vec3): void {
        check(isVec3(originDir) && !eq3(originDir, ZERO3), 'origin_dir', toArgStr(originDir));
        check(isVec3(upDir) && !eq3(upDir, ZERO3), 'up_dir', toArgStr(upDir));
        const xDir = _x_scratch;
        const yDir = _y_scratch;
        const zDir = _z_scratch;
        makeAxes(originDir, upDir, xDir, yDir, zDir);
        if (eq3(this._originDir, zDir) && eq3(this._upDir, yDir)) {
            return;
        }
        this._originDir = clone3(zDir);
        this._upDir = clone3(yDir);
        makeMat(xDir, yDir, zDir, this._rotationMat as Mat4Mut);
    }

    test(t: Vec3): Vec3 {
        return mul4v3(this._rotationMat, t);
    }

    getCenterPos(): Vec3 {
        return this._centerPos;
    }

    setCenterPos(value: Vec3): void {
        check(isVec3(value), 'center_pos', value);
        if (eq3(this._centerPos, value)) {
            return;
        }
        this._centerPos = clone3(value);
    }
}

function makeAxes(originDir: Vec3, upDir: Vec3, xDir: Vec3Mut, yDir: Vec3Mut, zDir: Vec3Mut): void {
    norm3(originDir, zDir);
    cross3(upDir, zDir, xDir);
    cross3(zDir, xDir, yDir);
    norm3(xDir, xDir);
    norm3(yDir, yDir);
}

function makeMat(xDir: Vec3, yDir: Vec3, zDir: Vec3, mat: Mat4Mut): void {
    identity4x4(mat);
    mat[rowcol2idxRank(4, 0, 0)] = xDir.x;
    mat[rowcol2idxRank(4, 1, 0)] = xDir.y;
    mat[rowcol2idxRank(4, 2, 0)] = xDir.z;
    mat[rowcol2idxRank(4, 0, 1)] = yDir.x;
    mat[rowcol2idxRank(4, 1, 1)] = yDir.y;
    mat[rowcol2idxRank(4, 2, 1)] = yDir.z;
    mat[rowcol2idxRank(4, 0, 2)] = zDir.x;
    mat[rowcol2idxRank(4, 1, 2)] = zDir.y;
    mat[rowcol2idxRank(4, 2, 2)] = zDir.z;
}

const _x_scratch = vec3(0, 0, 0) as Vec3Mut;
const _y_scratch = vec3(0, 0, 0) as Vec3Mut;
const _z_scratch = vec3(0, 0, 0) as Vec3Mut;

function check(condition: boolean, name: string, value: unknown): void {
    if (!condition) {
        throw new Error(`${name}: bad value ${value}`);
    }
}
