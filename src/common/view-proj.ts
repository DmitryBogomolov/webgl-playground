import type { CAMERA_PROJECTION } from './view-proj.types';
import type { Vec2, Vec2Mut } from '../geometry/vec2.types';
import type { Vec3, Vec3Mut } from '../geometry/vec3.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import type { EventProxy } from './event-emitter.types';
import type { Mapping } from './mapping.types';
import { EventEmitter } from './event-emitter';
import { fovDist2Size } from '../utils/fov';
import { toArgStr } from '../utils/string-formatter';
import { vec2, isVec2, eq2, clone2, mul2 } from '../geometry/vec2';
import { ZERO3, YUNIT3, ZUNIT3, vec3, isVec3, eq3, clone3, norm3, dist3 } from '../geometry/vec3';
import { mat4, perspective4x4, orthographic4x4, lookAt4x4, mul4x4, inverse4x4 } from '../geometry/mat4';

export class ViewProj {
    private readonly _changed = new EventEmitter();
    private readonly _projMat: Mat4 = mat4();
    private readonly _viewMat: Mat4 = mat4();
    private readonly _transformMat: Mat4 = mat4();
    private readonly _invtransformMat: Mat4 = mat4();
    private _projDirty: boolean = true;
    private _viewDirty: boolean = true;
    private _transformDirty: boolean = true;
    private _invtransformDirty: boolean = true;
    private _projImpl: ProjImpl = perspectiveImpl;
    private _zNear: number = 0.01;
    private _zFar: number = 100;
    private _viewportSize: Vec2 = vec2(2, 2);
    private _yFov: number = Math.PI / 3;
    private _upDir: Vec3 = clone3(YUNIT3);
    private _centerPos: Vec3 = clone3(ZERO3);
    private _eyePos: Vec3 = clone3(ZUNIT3);

    /**
     * Notifies about any change.
     */
    changed(): EventProxy {
        return this._changed.proxy();
    }

    private _markProjDirty(): void {
        this._projDirty = true;
        this._markTransformDirty();
        this._changed.emit();
    }

    private _markViewDirty(): void {
        this._viewDirty = true;
        this._markTransformDirty();
        this._changed.emit();
    }

    private _markTransformDirty(): void {
        this._transformDirty = true;
        this._markInvtransformDirty();
    }

    private _markInvtransformDirty(): void {
        this._invtransformDirty = true;
    }

    getProjType(): CAMERA_PROJECTION {
        return this._projImpl.type;
    }

    setProjType(value: CAMERA_PROJECTION): void {
        const impl = PROJ_TYPE_TO_IMPL_MAP[value];
        check(!!impl, 'proj_type', value);
        if (this._projImpl !== impl) {
            this._projImpl = impl;
            this._markProjDirty();
        }
    }

    getZNear(): number {
        return this._zNear;
    }

    setZNear(value: number): void {
        check(value > 0 && value < this._zFar, 'z_near', value);
        if (this._zNear !== value) {
            this._zNear = value;
            this._markProjDirty();
        }
    }

    getZFar(): number {
        return this._zFar;
    }

    setZFar(value: number): void {
        check(value > 0 && value > this._zNear, 'z_far', value);
        if (this._zFar !== value) {
            this._zFar = value;
            this._markProjDirty();
        }
    }

    getAspect(): number {
        return this._viewportSize.x / this._viewportSize.y;
    }

    getViewportSize(): Vec2 {
        return this._viewportSize;
    }

    setViewportSize(value: Vec2): void {
        check(isVec2(value), 'viewport_size', value);
        check(value.x > 0 && value.y > 0, 'viewport_size', toArgStr(value));
        if (!eq2(this._viewportSize, value)) {
            this._viewportSize = clone2(value);
            this._markProjDirty();
        }
    }

    getYFov(): number {
        return this._yFov;
    }

    getXFov(): number {
        return 2 * Math.atan((this._viewportSize.x / this._viewportSize.y) * Math.tan(this._yFov / 2));
    }

    setYFov(value: number): void {
        check(value > 0, 'y_fov', value);
        if (this._yFov !== value) {
            this._yFov = value;
            this._markProjDirty();
        }
    }

    getUpDir(): Vec3 {
        return this._upDir;
    }

    setUpDir(value: Vec3): void {
        check(isVec3(value), 'up_dir', value);
        check(!eq3(value, ZERO3), 'up_dir', toArgStr(ZERO3));
        const upDir = norm3(value, _v3_scratch as Vec3Mut);
        if (!eq3(this._upDir, upDir)) {
            this._upDir = clone3(upDir);
            this._markViewDirty();
        }
    }

    getCenterPos(): Vec3 {
        return this._centerPos;
    }

    setCenterPos(value: Vec3): void {
        check(isVec3(value), 'center_pos', value);
        if (!eq3(this._centerPos, value)) {
            this._centerPos = clone3(value);
            this._markViewDirty();
        }
    }

    getEyePos(): Vec3 {
        return this._eyePos;
    }

    setEyePos(value: Vec3): void {
        check(isVec3(value), 'eye_pos', value);
        if (!eq3(this._eyePos, value)) {
            this._eyePos = clone3(value);
            this._markViewDirty();
        }
    }

    private _buildProjMat(): void {
        this._projImpl.buildMat(this._zNear, this._zFar, this._yFov, this._viewportSize, this._projMat as Mat4Mut);
    }

    getProjMat(): Mat4 {
        if (this._projDirty) {
            this._projDirty = false;
            this._buildProjMat();
        }
        return this._projMat;
    }

    private _buildViewMat(): void {
        lookAt4x4({
            eye: this._eyePos,
            center: this._centerPos,
            up: this._upDir,
        }, this._viewMat as Mat4Mut);
    }

    getViewMat(): Mat4 {
        if (this._viewDirty) {
            this._viewDirty = false;
            this._buildViewMat();
        }
        return this._viewMat;
    }

    private _buildTransformMat(): void {
        mul4x4(this.getProjMat(), this.getViewMat(), this._transformMat as Mat4Mut);
    }

    /**
     * Returns PROJ * VIEW matrix.
     */
    getTransformMat(): Mat4 {
        if (this._transformDirty) {
            this._transformDirty = false;
            this._buildTransformMat();
        }
        return this._transformMat;
    }

    private _buildInvtransformMat(): void {
        inverse4x4(this.getTransformMat(), this._invtransformMat as Mat4Mut);
    }

    /**
     * Returns inverted PROJ * VIEW matrix.
     */
    getInvtransformMat(): Mat4 {
        if (this._invtransformDirty) {
            this._invtransformDirty = false;
            this._buildInvtransformMat();
        }
        return this._invtransformMat;
    }

    /**
     * Returns distance from "eye" to "center".
     */
    getViewDist(): number {
        return dist3(this._eyePos, this._centerPos);
    }

    /**
     * Returns viewport horizontal size in units.
     */
    getXViewSize(): number {
        return this._projImpl.getXViewSize(this._yFov, this._viewportSize, this.getViewDist());
    }

    /**
     * Returns viewport vertical size in units.
     */
    getYViewSize(): number {
        return this._projImpl.getYViewSize(this._yFov, this._viewportSize, this.getViewDist());
    }
}

interface ProjImpl {
    readonly type: CAMERA_PROJECTION;
    buildMat(zNear: number, zFar: number, yFov: number, viewportSize: Vec2, mat: Mat4Mut): void;
    getXViewSize(yFov: number, viewportSize: Vec2, viewDist: number): number;
    getYViewSize(yFov: number, viewportSize: Vec2, viewDist: number): number;
}

const perspectiveImpl: ProjImpl = {
    type: 'perspective',

    buildMat(zNear, zFar, yFov, { x, y }, mat) {
        perspective4x4({
            zNear,
            zFar,
            yFov,
            aspect: x / y,
        }, mat);
    },

    getXViewSize(yFov, viewportSize, viewDist) {
        return (viewportSize.x / viewportSize.y) * fovDist2Size(yFov, viewDist);
    },

    getYViewSize(yFov, _viewportSize, viewDist) {
        return fovDist2Size(yFov, viewDist);
    },
};

const _v2_scratch = vec2(0, 0);
const _v3_scratch = vec3(0, 0, 0);

const orthographicImpl: ProjImpl = {
    type: 'orthographic',

    buildMat(zNear, zFar, _yFov, viewportSize, mat) {
        const { x, y } = mul2(viewportSize, 0.5, _v2_scratch as Vec2Mut);
        orthographic4x4({
            zNear,
            zFar,
            left: -x,
            right: +x,
            top: +y,
            bottom: -y,
        }, mat);
    },

    getXViewSize(_yFov, viewportSize, _viewDist) {
        return viewportSize.x;
    },

    getYViewSize(_yFov, _viewportSize, _viewDist) {
        return _viewportSize.y;
    },
};

const PROJ_TYPE_TO_IMPL_MAP: Mapping<CAMERA_PROJECTION, ProjImpl> = {
    'perspective': perspectiveImpl,
    'orthographic': orthographicImpl,
};

function check(condition: boolean, name: string, value: unknown): void {
    if (!condition) {
        throw new Error(`${name}: bad value ${value}`);
    }
}
