import { Logger } from '../utils/logger';
import { fovDist2Size } from '../geometry/scalar';
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

    getProjType(): CAMERA_PROJECTION {
        return this._projType;
    }

    setProjType(value: CAMERA_PROJECTION): void {
        if (!(value === 'perspective' || value === 'orthographic')) {
            throw this._logger.error('bad "projType" value: {0}', value);
        }
        if (this._projType !== value) {
            this._projType = value;
            this._markProjDirty();
        }
    }

    getZNear(): number {
        return this._zNear;
    }

    setZNear(value: number): void {
        if (!(value > 0 && value < this._zFar)) {
            throw this._logger.error('bad "zNear" value: {0}', value);
        }
        if (this._zNear !== value) {
            this._zNear = value;
            this._markProjDirty();
        }
    }

    getZFar(): number {
        return this._zFar;
    }

    setZFar(value: number): void {
        if (!(value > 0 && value > this._zNear)) {
            throw this._logger.error('bad "zFar" value: {0}', value);
        }
        if (this._zFar !== value) {
            this._zFar = value;
            this._markProjDirty();
        }
    }

    getViewportSize(): Vec2 {
        return this._viewportSize;
    }

    setViewportSize(value: Vec2): void {
        if (!(isVec2(value) && value.x > 0 && value.y > 0)) {
            throw this._logger.error('bad "viewportSize" value: {0}', value);
        }
        if (!eq2(this._viewportSize, value)) {
            this._viewportSize = value;
            this._markProjDirty();
        }
    }

    getYFOV(): number {
        return this._yFOV;
    }

    getXFOV(): number {
        return 2 * Math.atan((this._viewportSize.x / this._viewportSize.y) * Math.tan(this._yFOV / 2));
    }

    setYFOV(value: number): void {
        if (!(value > 0)) {
            throw this._logger.error('bad "yFOV" value: {0}', value);
        }
        if (this._yFOV !== value) {
            this._yFOV = value;
            this._markProjDirty();
        }
    }

    getUpDir(): Vec3 {
        return this._upDir;
    }

    setUpDir(value: Vec3): void {
        if (!(isVec3(value) && !eq3(value, ZERO3))) {
            throw this._logger.error('bad "upDir" value: {0}', value);
        }
        const upDir = norm3(value);
        if (!eq3(this._upDir, upDir)) {
            this._upDir = upDir;
            this._markViewDirty();
        }
    }

    getCenterPos(): Vec3 {
        return this._centerPos;
    }

    setCenterPos(value: Vec3): void {
        if (!isVec3(value)) {
            throw this._logger.error('bad "centerPos" value: {0}', value);
        }
        if (!eq3(this._centerPos, value)) {
            this._centerPos = value;
            this._markViewDirty();
        }
    }

    getEyePos(): Vec3 {
        return this._eyePos;
    }

    setEyePos(value: Vec3): void {
        if (!isVec3(value)) {
            throw this._logger.error('bad "eyePos" value: {0}', value);
        }
        if (!eq3(this._eyePos, value)) {
            this._eyePos = value;
            this._markViewDirty();
        }
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
        }, this._viewMat);
    }

    getViewMat(): Mat4 {
        if (this._viewDirty) {
            this._viewDirty = false;
            this._buildViewMat();
        }
        return this._viewMat;
    }

    private _buildTransformMat(): void {
        mul4x4(this.getProjMat(), this.getViewMat(), this._transformMat);
    }

    getTransformMat(): Mat4 {
        if (this._transformDirty) {
            this._transformDirty = false;
            this._buildTransformMat();
        }
        return this._transformMat;
    }

    private _buildInvtransformMat(): void {
        inverse4x4(this.getTransformMat(), this._invtransformMat);
    }

    getInvtransformMat(): Mat4 {
        if (this._invtransformDirty) {
            this._invtransformDirty = false;
            this._buildInvtransformMat();
        }
        return this._invtransformMat;
    }

    getViewDist(): number {
        return dist3(this._eyePos, this._centerPos);
    }

    getYViewSize(): number {
        return fovDist2Size(this.getYFOV(), this.getViewDist());
    }

    getXViewSize(): number {
        return (this._viewportSize.x / this._viewportSize.y) * this.getYViewSize();
    }
}
