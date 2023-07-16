import type { GlTF_PRIMITIVE_MODE } from './primitive.types';
import type { GlTFSchema } from './asset.types';

const PRIMITIVE_MODE_MAPPING: Readonly<Record<number, GlTF_PRIMITIVE_MODE>> = {
    [0]: 'points',
    [1]: 'lines',
    [2]: 'line_loop',
    [3]: 'line_strip',
    [4]: 'triangles',
    [5]: 'triangle_strip',
    [6]: 'triangle_fan',
};
const DEFAULT_PRIMITIVE_MODE: GlTF_PRIMITIVE_MODE = 'triangles';

export function getPrimitiveMode(primitive: GlTFSchema.MeshPrimitive): GlTF_PRIMITIVE_MODE {
    return primitive.mode !== undefined ? PRIMITIVE_MODE_MAPPING[primitive.mode] : DEFAULT_PRIMITIVE_MODE;
}
