import type { Runtime } from './runtime';

export type VERTEX_ATTRIBUTE_TYPE = (
    | 'byte' | 'byte2' | 'byte3' | 'byte4'
    | 'ubyte' | 'ubyte2' | 'ubyte3' | 'ubyte4'
    | 'short' | 'short2' | 'short3' | 'short4'
    | 'ushort' | 'ushort2' | 'ushort3' | 'ushort4'
    | 'int' | 'int2' | 'int3' | 'int4'
    | 'uint' | 'uint2' | 'uint3' | 'uint4'
    | 'float' | 'float2' | 'float3' | 'float4'
);

// TODO: Rename to 'ubyte', 'ushort', 'uint'.
export type INDEX_TYPE = (
    'u8' | 'u16' | 'u32'
);

export type PRIMITIVE_MODE = (
    'points' | 'line_strip' | 'line_loop' | 'lines' | 'triangle_strip' | 'triangle_fan' | 'triangles'
);

export interface VertexAttributeDefinition {
    readonly type: VERTEX_ATTRIBUTE_TYPE;
    readonly location?: number;
    readonly normalized?: boolean;
    readonly stride?: number;
    readonly offset?: number;
}

export interface PrimitiveVertexSchema {
    // TODO: Rename to "attributes".
    readonly attrs: ReadonlyArray<VertexAttributeDefinition>;
}

export interface PrimitiveIndexConfig {
    readonly indexCount: number;
    readonly indexOffset?: number;
    readonly indexType?: INDEX_TYPE;
    readonly primitiveMode?: PRIMITIVE_MODE;
}

export type PrimitiveRuntime = Pick<
    Runtime,
    | 'gl' | 'vaoExt' | 'logger'
    | 'bindArrayBuffer' | 'bindElementArrayBuffer' | 'bindVertexArrayObject' | 'useProgram'
>;
