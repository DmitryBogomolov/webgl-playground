import type { Vec2 } from '../geometry/vec2.types';
import type { Vec3 } from '../geometry/vec3.types';
import type { Vec4 } from '../geometry/vec4.types';
import type { Mat2 } from '../geometry/mat2.types';
import type { Mat3 } from '../geometry/mat3.types';
import type { Mat4 } from '../geometry/mat4.types';
import type { Color } from '../common/color.types';
import type { VERTEX_ATTRIBUTE_TYPE } from './vertex.types';
import type { VertexSchema } from './vertex-schema.types';
import type { Runtime } from './runtime';

export type UNIFORM_VALUE = (
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

export type UNIFORM_TYPE = (
    | VERTEX_ATTRIBUTE_TYPE
    | 'float2x2' | 'float3x3' | 'float4x4'
);

export interface ShaderAttribute {
    readonly name: string;
    readonly location: number;
    readonly type: VERTEX_ATTRIBUTE_TYPE;
}

export interface ShaderUniform {
    readonly name: string;
    readonly type: UNIFORM_TYPE;
}

export interface ProgramOptions {
    readonly vertShader: string;
    readonly fragShader: string;
    readonly schema: VertexSchema;
    readonly defines?: Readonly<Record<string, string>>;
}

export type ProgramRuntime = Pick<
    Runtime,
    'gl' | 'logger' | 'useProgram'
>;
