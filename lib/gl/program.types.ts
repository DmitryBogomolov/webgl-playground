import type { Vec2 } from '../geometry/vec2.types';
import type { Vec3 } from '../geometry/vec3.types';
import type { Vec4 } from '../geometry/vec4.types';
import type { Mat2 } from '../geometry/mat2.types';
import type { Mat3 } from '../geometry/mat3.types';
import type { Mat4 } from '../geometry/mat4.types';
import type { Color } from '../common/color.types';
import type { Mapping } from '../common/mapping.types';
import type { Runtime } from './runtime';

export type SHADER_ATTRIBUTE_TYPE = (
    | 'float' | 'float2' | 'float3' | 'float4'
    | 'int' | 'int2' | 'int3' | 'int4'
    | 'bool' | 'bool2' | 'bool3' | 'bool4'
);

export type SHADER_UNIFORM_TYPE = (
    | SHADER_ATTRIBUTE_TYPE
    | 'float2x2' | 'float3x3' | 'float4x4'
    | 'sampler2D' | 'samplerCube'
);

export interface ShaderAttribute {
    readonly name: string;
    readonly location: number;
    readonly type: SHADER_ATTRIBUTE_TYPE;
}

export interface ShaderUniform {
    readonly name: string;
    readonly type: SHADER_UNIFORM_TYPE;
    readonly location: WebGLUniformLocation;
    readonly arraySize: number;
}

export type SHADER_UNIFORM_VALUE = (
    | boolean
    | number
    | Readonly<[number]>
    | Readonly<[number, number]>
    | Readonly<[number, number, number]>
    | Readonly<[number, number, number, number]>
    | ReadonlyArray<number>
    | Vec2 | Vec3 | Vec4
    | Mat2 | Mat3 | Mat4
    | Color
);

export interface ProgramOptions {
    readonly vertShader: string;
    readonly fragShader: string;
    readonly locations?: Mapping<string, number>;
    readonly defines?: Mapping<string, string>;
}

export type ProgramRuntime = Pick<
    Runtime,
    'gl' | 'logger' | 'useProgram'
>;
