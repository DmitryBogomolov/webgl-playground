import type { Vec2 } from '../geometry/vec2.types';
import type { Vec3 } from '../geometry/vec3.types';
import type { Vec4 } from '../geometry/vec4.types';
import type { Color } from '../common/color.types';

export type ATTRIBUTE_VALUE = (
    | number
    | Readonly<[number]>
    | Readonly<[number, number]>
    | Readonly<[number, number, number]>
    | Readonly<[number, number, number, number]>
    | Vec2 | Vec3 | Vec4
    | Color
);
