import { Vec2 } from '../../geometry/types/vec2';
import { Vec3 } from '../../geometry/types/vec3';
import { Vec4 } from '../../geometry/types/vec4';
import { Mat2 } from '../../geometry/types/mat2';
import { Mat3 } from '../../geometry/types/mat3';
import { Mat4 } from '../../geometry/types/mat4';
import { Color } from '../types/color';

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
