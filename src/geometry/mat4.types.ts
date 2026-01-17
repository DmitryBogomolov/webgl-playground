import { Vec3 } from './vec3.types';

export type Mat4 = Readonly<[
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
]>;

export type Mat4Mut = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
] & {
    readonly _NO_IMPLICIT_MAT4_CAST: null;
};

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
