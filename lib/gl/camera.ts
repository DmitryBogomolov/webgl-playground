import { Logger } from '../utils/logger';
import { fovDist2Size, fovSize2Dist } from '../geometry/scalar';
import { Vec2, vec2, isVec2, eq2, mul2 } from '../geometry/vec2';
import { Vec3, ZERO3, YUNIT3, ZUNIT3, isVec3, eq3, norm3, dist3 } from '../geometry/vec3';
import {
    Mat4, mat4,
    perspective4x4, orthographic4x4, lookAt4x4,
    mul4x4, inverse4x4,
} from '../geometry/mat4';

export type CAMERA_PROJECTION = ('perspective' | 'orthographic');

export class Camera {
    private readonly _logger = new Logger('Camera');
    private readonly _projMat: Mat4 = mat4();
    private readonly _viewMat: Mat4 = mat4();
    private readonly _transformMat: Mat4 = mat4();
    private readonly _invtransformMat: Mat4 = mat4();
    private _projDirty: boolean = true;
    private _viewDirty: boolean = true;
    private _transformDirty: boolean = true;
    private _invtransformDirty: boolean = true;
    private _projType: CAMERA_PROJECTION = 'perspective';
    private _zNear: number = 0.01;
    private _zFar: number = 100;
    private _viewportSize: Vec2 = vec2(2, 2);
    private _yFOV: number = Math.PI / 3;
    private _upDir: Vec3 = YUNIT3;
    private _centerPos: Vec3 = ZERO3;
    private _eyePos: Vec3 = ZUNIT3;

    private _markProjDirty(): void {
        this._projDirty = true;
        this._markTransformDirty();
    }

    private _markViewDirty(): void {
        this._viewDirty = true;
        this._markTransformDirty();
    }

    private _markTransformDirty(): void {
        this._transformDirty = true;
        this._markInvtransformDirty();
    }

    private _markInvtransformDirty(): void {
        this._invtransformDirty = true;
    }

    projType(): CAMERA_PROJECTION;
    projType(value: CAMERA_PROJECTION): this;
    projType(value?: CAMERA_PROJECTION): CAMERA_PROJECTION | this {
        if (value === undefined) {
            return this._projType;
        }
        if (!(value === 'perspective' || value === 'orthographic')) {
            throw this._logger.error('bad "projType" value: {0}', value);
        }
        if (this._projType !== value) {
            this._projType = value;
            this._markProjDirty();
        }
        return this;
    }

    zNear(): number;
    zNear(value: number): this;
    zNear(value?: number): number | this {
        if (value === undefined) {
            return this._zNear;
        }
        if (!(value > 0 && value < this._zFar)) {
            throw this._logger.error('bad "zNear" value: {0}', value);
        }
        if (this._zNear !== value) {
            this._zNear = value;
            this._markProjDirty();
        }
        return this;
    }

    zFar(): number;
    zFar(value: number): this;
    zFar(value?: number): number | this {
        if (value === undefined) {
            return this._zFar;
        }
        if (!(value > 0 && value > this._zNear)) {
            throw this._logger.error('bad "zFar" value: {0}', value);
        }
        if (this._zFar !== value) {
            this._zFar = value;
            this._markProjDirty();
        }
        return this;
    }

    viewportSize(): Vec2;
    viewportSize(value: Vec2): this;
    viewportSize(value?: Vec2): Vec2 | this {
        if (value === undefined) {
            return this._viewportSize;
        }
        if (!(isVec2(value) && value.x > 0 && value.y > 0)) {
            throw this._logger.error('bad "viewportSize" value: {0}', value);
        }
        if (!eq2(this._viewportSize, value)) {
            this._viewportSize = value;
            this._markProjDirty();
        }
        return this;
    }

    yFOV(): number;
    yFOV(value: number): this;
    yFOV(value?: number): number | this {
        if (value === undefined) {
            return this._yFOV;
        }
        if (!(value > 0)) {
            throw this._logger.error('bad "yFOV" value: {0}', value);
        }
        if (this._yFOV !== value) {
            this._yFOV = value;
            this._markProjDirty();
        }
        return this;
    }

    upDir(): Vec3;
    upDir(value: Vec3): this;
    upDir(value?: Vec3): Vec3 | this {
        if (value === undefined) {
            return this._upDir;
        }
        if (!(isVec3(value) && !eq3(value, ZERO3))) {
            throw this._logger.error('bad "upDir" value: {0}', value);
        }
        const upDir = norm3(value);
        if (!eq3(this._upDir, upDir)) {
            this._upDir = upDir;
            this._markViewDirty();
        }
        return this;
    }

    centerPos(): Vec3;
    centerPos(value: Vec3): this;
    centerPos(value?: Vec3): Vec3 | this {
        if (value === undefined) {
            this._centerPos;
        }
        if (!isVec3(value)) {
            throw this._logger.error('bad "centerPos" value: {0}', value);
        }
        if (!eq3(this._centerPos, value)) {
            this._centerPos = value;
            this._markViewDirty();
        }
        return this;
    }

    eyePos(): Vec3;
    eyePos(value: Vec3): this;
    eyePos(value?: Vec3): Vec3 | this {
        if (value === undefined) {
            return this._eyePos;
        }
        if (!isVec3(value)) {
            throw this._logger.error('bad "eyePos" value: {0}', value);
        }
        if (!eq3(this._eyePos, value)) {
            this._eyePos = value;
            this._markViewDirty();
        }
        return this;
    }

    private _buildPerspectiveMat(): void {
        const { x, y } = this._viewportSize;
        perspective4x4({
            zNear: this._zNear,
            zFar: this._zFar,
            yFov: this._yFOV,
            aspect: x / y,
        }, this._projMat);
    }

    private _buildOrthographicMat(): void {
        const { x, y } = mul2(this._viewportSize, 0.5);
        orthographic4x4({
            zNear: this._zNear,
            zFar: this._zFar,
            left: -x,
            right: +x,
            top: +y,
            bottom: -y,
        }, this._projMat);
    }

    private _buildProjMat(): void {
        switch (this._projType) {
        case 'perspective':
            this._buildPerspectiveMat();
            break;
        case 'orthographic':
            this._buildOrthographicMat();
            break;
        }
    }

    projMat(): Mat4 {
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
        }, this._viewMat);
    }

    viewMat(): Mat4 {
        if (this._viewDirty) {
            this._viewDirty = false;
            this._buildViewMat();
        }
        return this._viewMat;
    }

    private _buildTransformMat(): void {
        mul4x4(this.projMat(), this.viewMat(), this._transformMat);
    }

    transformMat(): Mat4 {
        if (this._transformDirty) {
            this._transformDirty = false;
            this._buildTransformMat();
        }
        return this._transformMat;
    }

    private _buildInvtransformMat(): void {
        inverse4x4(this.transformMat(), this._invtransformMat);
    }

    invtransformMat(): Mat4 {
        if (this._invtransformDirty) {
            this._invtransformDirty = false;
            this._buildInvtransformMat();
        }
        return this._invtransformMat;
    }

    viewDistance(): number {
        return dist3(this._eyePos, this._centerPos);
    }

    fovDist2Size(dist: number): number {
        return fovDist2Size(this._yFOV, dist);
    }

    fovSize2Dist(size: number): number {
        return fovSize2Dist(this._yFOV, size);
    }
}
