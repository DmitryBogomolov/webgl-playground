import type { Vec2 } from '../../geometry/types/vec2';
import type { Vec3 } from '../../geometry/types/vec3';
import type { Vec4 } from '../../geometry/types/vec4';
import type { Color } from './color';

export type AttrValue = (
    | number
    | Readonly<[number]>
    | Readonly<[number, number]>
    | Readonly<[number, number, number]>
    | Readonly<[number, number, number, number]>
    | Vec2 | Vec3 | Vec4
    | Color
);
