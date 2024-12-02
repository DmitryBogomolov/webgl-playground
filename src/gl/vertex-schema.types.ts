export type VERTEX_ATTRIBUTE_TYPE = (
    | 'byte' | 'byte2' | 'byte3' | 'byte4'
    | 'ubyte' | 'ubyte2' | 'ubyte3' | 'ubyte4'
    | 'short' | 'short2' | 'short3' | 'short4'
    | 'ushort' | 'ushort2' | 'ushort3' | 'ushort4'
    | 'int' | 'int2' | 'int3' | 'int4'
    | 'uint' | 'uint2' | 'uint3' | 'uint4'
    | 'float' | 'float2' | 'float3' | 'float4'
);

export interface VertexAttributeDefinition {
    readonly type: VERTEX_ATTRIBUTE_TYPE;
    readonly location?: number;
    readonly normalized?: boolean;
    readonly stride?: number;
    readonly offset?: number;
}

export interface VertexAttributeInfo {
    readonly location: number;
    readonly type: number;
    readonly rank: number;
    readonly size: number;
    readonly normalized: boolean;
    readonly offset: number;
    readonly stride: number;
}

export interface VertexSchemaDefinition {
    readonly attributes: ReadonlyArray<VertexAttributeDefinition>;
}

export interface VertexSchemaInfo {
    readonly vertexSize: number;
    readonly attributes: ReadonlyArray<VertexAttributeInfo>;
}
