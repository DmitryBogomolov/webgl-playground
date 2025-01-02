import { Vec3 } from './vec3.types';

export interface Mat4 extends Iterable<number> {
    readonly [i: number]: number;
}

export interface Mat4Mut extends Iterable<number> {
    [i: number]: number;
    readonly _NO_IMPLICIT_MAT4_CAST: null;
}

export interface Orthogrpahic4x4Options {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly zNear: number;
    readonly zFar: number;
}

export interface Perspective4x4Options {
    readonly yFov: number;
    readonly aspect: number;
    readonly zNear: number;
    readonly zFar: number;
}

export interface Frustum4x4Options {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly zNear: number;
    readonly zFar: number;
}

export interface LookAt4x4Options {
    readonly eye: Vec3;
    readonly center: Vec3;
    readonly up: Vec3;
}

export interface TargetTo4x4Options {
    readonly eye: Vec3;
    readonly target: Vec3;
    readonly up: Vec3;
}
