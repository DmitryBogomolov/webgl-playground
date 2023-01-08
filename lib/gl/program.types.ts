import type { Vec2 } from '../geometry/vec2.types';
import type { Vec3 } from '../geometry/vec3.types';
import type { Vec4 } from '../geometry/vec4.types';
import type { Mat2 } from '../geometry/mat2.types';
import type { Mat3 } from '../geometry/mat3.types';
import type { Mat4 } from '../geometry/mat4.types';
import type { Color } from './color.types';
import type { VertexSchema } from './vertex-schema.types';
import type { Runtime } from './runtime';

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
    'gl' | 'logger' | 'useProgram'
>;
