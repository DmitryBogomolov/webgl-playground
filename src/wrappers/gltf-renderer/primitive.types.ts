import type { Mapping } from '../../common/mapping.types';
import type { GlTFMaterial } from '../../gltf/material.types';
import type { Primitive } from '../../gl/primitive';
import type { Mat4 } from '../../geometry/mat4.types';

export interface PrimitiveWrapper {
    readonly primitive: Primitive;
    readonly matrix: Mat4;
    readonly normalMatrix: Mat4;
    readonly material: GlTFMaterial | null;
    readonly description: Mapping<string, string>;
}
