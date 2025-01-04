import type { OrbitCameraEyePosition as OrbitCameraPosition } from './orbit-camera.types';
import type { Vec3, Vec3Mut } from '../geometry/vec3.types';
import type { Vec4Mut } from '../geometry/vec4.types';
import type { Mat4Mut } from '../geometry/mat4.types';
import type { SphericalMut } from '../geometry/spherical.types';
import { ZERO3, YUNIT3, ZUNIT3, vec3, isVec3, eq3, clone3, norm3, cross3 } from '../geometry/vec3';
import { clone4 } from '../geometry/vec4';
import { QUAT4_UNIT, quat4apply, quat4fromMat } from '../geometry/quat4';
import { mat4, identity4x4 } from '../geometry/mat4';
import { floatEq } from '../geometry/float-eq';
import { ViewProj } from './view-proj';
import { toArgStr } from '../utils/string-formatter';
import { rowcol2idxRank } from '../geometry/helpers';
import { spherical2zxy } from '../geometry/spherical';

export class OrbitCamera extends ViewProj {
    private readonly _rotationQuat = clone4(QUAT4_UNIT);
    private _originDir: Vec3 = clone3(ZUNIT3);
    private _lon = 0;
    private _lat = 0;
    private _dist = 1;

    getOriginDir(): Vec3 {
        return this._originDir;
    }

    getLon(): number {
        return this._lon;
    }

    getLat(): number {
        return this._lat;
    }

    getDist(): number {
        return this._dist;
    }

    setUpDir(_value: Vec3): void {
        throw new TypeError('setUpDir - not supported');
    }

    setEyePos(_value: Vec3): void {
        throw new TypeError('setEyePos - not supported');
    }

    setOrientation(originDir: Vec3, upDir: Vec3 = clone3(YUNIT3)): void {
        check(isVec3(originDir) && !eq3(originDir, ZERO3), 'origin_dir', toArgStr(originDir));
        check(isVec3(upDir) && !eq3(upDir, ZERO3), 'up_dir', toArgStr(upDir));
        const xDir = _x_scratch;
        const yDir = _y_scratch;
        const zDir = _z_scratch;
        makeAxes(originDir, upDir, xDir, yDir, zDir);
        if (eq3(this._originDir, zDir) && eq3(this.getUpDir(), yDir)) {
            return;
        }
        this._originDir = clone3(zDir);
        makeRotation(xDir, yDir, zDir, this._rotationQuat as Vec4Mut);
        super.setUpDir(yDir);
    }

    setPosition(value: OrbitCameraPosition): void {
        const lon = clampLon(value.lon ?? this._lon);
        const lat = clampLat(value.lat ?? this._lat);
        const dist = clampDist(value.dist ?? this._dist);
        if (floatEq(lon, this._lon) && floatEq(lat, this._lat) && floatEq(dist, this._dist)) {
            return;
        }
        const eyePos = _eyePos_scratch;
        makeEyePos(lon, lat, dist, eyePos);
        quat4apply(this._rotationQuat, eyePos, eyePos);
        this._lon = lon;
        this._lat = lat;
        this._dist = dist;
        super.setEyePos(eyePos);
    }
}

function makeAxes(originDir: Vec3, upDir: Vec3, xDir: Vec3Mut, yDir: Vec3Mut, zDir: Vec3Mut): void {
    norm3(originDir, zDir);
    cross3(upDir, zDir, xDir);
    cross3(zDir, xDir, yDir);
    norm3(xDir, xDir);
    norm3(yDir, yDir);
}

const ROTATION_MAP = [
    rowcol2idxRank(4, 0, 0), rowcol2idxRank(4, 1, 0), rowcol2idxRank(4, 2, 0),
    rowcol2idxRank(4, 0, 1), rowcol2idxRank(4, 1, 1), rowcol2idxRank(4, 2, 1),
    rowcol2idxRank(4, 0, 2), rowcol2idxRank(4, 1, 2), rowcol2idxRank(4, 2, 2),
] as const;
function makeRotation(xDir: Vec3, yDir: Vec3, zDir: Vec3, rotation: Vec4Mut): void {
    const mat = _mat_scratch;
    identity4x4(mat);
    const [xx, xy, xz, yx, yy, yz, zx, zy, zz] = ROTATION_MAP;
    mat[xx] = xDir.x;
    mat[xy] = xDir.y;
    mat[xz] = xDir.z;
    mat[yx] = yDir.x;
    mat[yy] = yDir.y;
    mat[yz] = yDir.z;
    mat[zx] = zDir.x;
    mat[zy] = zDir.y;
    mat[zz] = zDir.z;
    quat4fromMat(mat, rotation);
}

function makeEyePos(lon: number, lat: number, dist: number, eye: Vec3Mut): void {
    _spherical_scratch.distance = dist;
    _spherical_scratch.azimuth = lon;
    _spherical_scratch.elevation = lat;
    spherical2zxy(_spherical_scratch, eye);
}

const _x_scratch = vec3(0, 0, 0) as Vec3Mut;
const _y_scratch = vec3(0, 0, 0) as Vec3Mut;
const _z_scratch = vec3(0, 0, 0) as Vec3Mut;
const _eyePos_scratch = vec3(0, 0, 0) as Vec3Mut;
const _spherical_scratch = { distance: 0, azimuth: 0, elevation: 0 } as SphericalMut;
const _mat_scratch = mat4() as Mat4Mut;

const PI = Math.PI;
const DBL_PI = PI * 2;
const HLF_PI = PI / 2;
const EPS = 0.05;

function clampLon(value: number): number {
    if (value > +PI) {
        return value - Math.ceil(+value / DBL_PI) * DBL_PI;
    }
    if (value < -PI) {
        return value + Math.ceil(-value / DBL_PI) * DBL_PI;
    }
    return value;
}

function clampLat(value: number): number {
    if (value >= +HLF_PI) {
        return +HLF_PI - EPS;
    }
    if (value <= -HLF_PI) {
        return -HLF_PI + EPS;
    }
    return value;
}

function clampDist(value: number): number {
    if (value <= 0) {
        return EPS;
    }
    return value;
}

function check(condition: boolean, name: string, value: unknown): void {
    if (!condition) {
        throw new Error(`${name}: bad value ${value}`);
    }
}
