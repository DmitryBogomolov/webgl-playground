import type { OrbitCameraEyePosition } from './orbit-camera.types';
import type { Vec3, Vec3Mut } from '../geometry/vec3.types';
import type { Vec4Mut } from '../geometry/vec4.types';
import type { Mat4Mut } from '../geometry/mat4.types';
import type { EventProxy } from './event-emitter.types';
import { ZERO3, YUNIT3, ZUNIT3, vec3, isVec3, eq3, clone3, norm3, dist3, cross3, mul3 } from '../geometry/vec3';
import { clone4 } from '../geometry/vec4';
import { QUAT4_UNIT, quat4apply, quat4fromMat } from '../geometry/quat4';
import { mat4, identity4x4, mul4v3 } from '../geometry/mat4';
import { floatEq } from '../geometry/float-eq';
import { ViewProj } from './view-proj';
import { toArgStr } from '../utils/string-formatter';
import { EventEmitter } from './event-emitter';
import { rowcol2idxRank } from '../geometry/helpers';

export class OrbitCamera {
    private readonly _viewProj = new ViewProj();
    private readonly _rotationMat = mat4();
    private readonly _rotationQuat = clone4(QUAT4_UNIT);
    private _originDir: Vec3 = clone3(ZUNIT3);
    private _upDir: Vec3 = clone3(YUNIT3);
    private _centerPos: Vec3 = clone3(ZERO3);
    private _eyePos: Vec3 = clone3(ZUNIT3);
    private _lon = 0;
    private _lat = 0;
    private _dist = 1;

    changed(): EventProxy {
        return this._viewProj.changed();
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
        // this._viewProj.setUpDir(yDir);
        this._originDir = clone3(zDir);
        this._upDir = clone3(yDir);
        makeMat(xDir, yDir, zDir, this._rotationMat as Mat4Mut);
        quat4fromMat(this._rotationMat, this._rotationQuat as Vec4Mut);
    }

    test(t: Vec3): Vec3 {
        // return mul4v3(this._rotationMat, t);
        return quat4apply(this._rotationQuat, t);
    }

    getCenterPos(): Vec3 {
        return this._centerPos;
    }

    setCenterPos(value: Vec3): void {
        check(isVec3(value), 'center_pos', toArgStr(value));
        if (eq3(this._centerPos, value)) {
            return;
        }
        // this._viewProj.setCenterPos(value);
        this._centerPos = clone3(value);
    }

    setEyePos(value: OrbitCameraEyePosition): void {
        const lon = value.lon ?? this._lon;
        const lat = value.lat ?? this._lat;
        const dist = value.dist ?? this._dist;
        if (floatEq(lon, this._lon) && floatEq(lat, this._lat) && floatEq(dist, this._dist)) {
            return;
        }
        const eyePos = _eyePos_scratch;
        makeEyePos(lon, lat, dist, eyePos);
        quat4apply(this._rotationQuat, eyePos, eyePos);
        // this._viewProj.setEyePos(eyePos);
        this._eyePos = clone3(eyePos);
        this._lon = lon;
        this._lat = lat;
        this._dist = dist;
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

function makeEyePos(lon: number, lat: number, dist: number, eye: Vec3Mut): void {
    eye.x = Math.cos(lon) * Math.sin(lat);
    eye.y = Math.sin(lon),
    eye.z = Math.cos(lon) * Math.cos(lat),
    mul3(eye, dist, eye);
}

const _x_scratch = vec3(0, 0, 0) as Vec3Mut;
const _y_scratch = vec3(0, 0, 0) as Vec3Mut;
const _z_scratch = vec3(0, 0, 0) as Vec3Mut;
const _eyePos_scratch = vec3(0, 0, 0) as Vec3Mut;

function check(condition: boolean, name: string, value: unknown): void {
    if (!condition) {
        throw new Error(`${name}: bad value ${value}`);
    }
}
