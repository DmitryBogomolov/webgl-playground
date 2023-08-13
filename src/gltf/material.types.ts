import type { Color } from '../common/color.types';

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metallic-roughness-material
export interface GlTFMaterial {
    readonly baseColorFactor: Color;
    readonly metallicFactor: number;
    readonly roughnessFactor: number;
    // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_material_pbrmetallicroughness_basecolortexture
    readonly baseColorTextureIndex?: number;
    // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_material_pbrmetallicroughness_metallicroughnesstexture
    readonly metallicRoughnessTextureIndex?: number;
}
