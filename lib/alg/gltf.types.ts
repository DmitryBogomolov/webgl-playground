import type * as GlTFSchema from './gltf-schema.types';

export type { GlTFSchema };

export interface GlTFAsset {
    readonly desc: GlTFSchema.GlTf;
    readonly data: ArrayBuffer;
}

export type GlTFAccessorType = (
    | 'float' | 'float2' | 'float3' | 'float4'
    | 'byte' | 'byte2' | 'byte3' | 'byte4'
    | 'ubyte' | 'ubyte2' | 'ubyte3' | 'ubyte4'
    | 'short' | 'short2' | 'short3' | 'short4'
    | 'ushort' | 'ushort2' | 'ushort3' | 'ushort4'
    | 'uint' | 'uint2' | 'uint3' | 'uint4'
);

export type GlTFPrimitiveMode = (
    | 'points' | 'lines' | 'line_loop' | 'line_strip' | 'triangles' | 'triangle_strip' | 'triangle_fan'
);
