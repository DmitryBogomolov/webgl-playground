import type { Vec2 } from '../geometry/vec2.types';
import type { Vec3 } from '../geometry/vec3.types';
import type { Vec4 } from '../geometry/vec4.types';
import type { Color } from '../common/color.types';
import type { Mapping } from '../common/mapping.types';
import type { BaseObjectParams } from './base-object.types';
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
    | Color
);

export type ProgramRuntime = Pick<
    Runtime,
    'gl' | 'logger' | 'useProgram'
>;

export interface ProgramParams extends BaseObjectParams {
    readonly runtime: ProgramRuntime;
    readonly vertShader: string;
    readonly fragShader: string;
    readonly locations?: Mapping<string, number>;
    readonly defines?: Mapping<string, string>;
}
