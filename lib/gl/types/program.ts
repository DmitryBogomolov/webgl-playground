import type { Vec2 } from '../../geometry/types/vec2';
import type { Vec3 } from '../../geometry/types/vec3';
import type { Vec4 } from '../../geometry/types/vec4';
import type { Mat2 } from '../../geometry/types/mat2';
import type { Mat3 } from '../../geometry/types/mat3';
import type { Mat4 } from '../../geometry/types/mat4';
import type { Color } from '../types/color';
import type { VertexSchema } from './vertex-schema';
import type { Runtime } from '../runtime';

export type UniformValue = (
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
    readonly schema: VertexSchema;
}

export type ProgramRuntime = Pick<
    Runtime,
    'gl' | 'useProgram'
>;
