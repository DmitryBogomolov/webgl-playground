import type * as GlTFSchema from './gltf-schema.types';

export type { GlTFSchema };

export interface GlTFAsset {
    readonly gltf: GlTFSchema.GlTf;
    readonly buffers: ReadonlyArray<ArrayBuffer>;
}

export type GlTF_ACCESSOR_TYPE = (
    | 'float1' | 'float2' | 'float3' | 'float4'
    | 'byte1' | 'byte2' | 'byte3' | 'byte4'
    | 'ubyte1' | 'ubyte2' | 'ubyte3' | 'ubyte4'
    | 'short1' | 'short2' | 'short3' | 'short4'
    | 'ushort1' | 'ushort2' | 'ushort3' | 'ushort4'
    | 'uint1' | 'uint2' | 'uint3' | 'uint4'
);

export type GlTF_PRIMITIVE_MODE = (
    | 'points' | 'lines' | 'line_loop' | 'line_strip' | 'triangles' | 'triangle_strip' | 'triangle_fan'
);
