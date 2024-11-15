import type { Runtime } from './runtime';
import type { BaseObjectParams } from './base-object.types';

export type VERTEX_ATTRIBUTE_TYPE = (
    | 'byte' | 'byte2' | 'byte3' | 'byte4'
    | 'ubyte' | 'ubyte2' | 'ubyte3' | 'ubyte4'
    | 'short' | 'short2' | 'short3' | 'short4'
    | 'ushort' | 'ushort2' | 'ushort3' | 'ushort4'
    | 'int' | 'int2' | 'int3' | 'int4'
    | 'uint' | 'uint2' | 'uint3' | 'uint4'
    | 'float' | 'float2' | 'float3' | 'float4'
);

export type INDEX_TYPE = (
    'ubyte' | 'ushort' | 'uint'
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

export interface PrimitiveConfig {
    readonly vertexData: BufferSource | number;
    readonly indexData: BufferSource | number;
    readonly vertexSchema: PrimitiveVertexSchema;
    readonly indexType?: INDEX_TYPE;
    readonly primitiveMode?: PRIMITIVE_MODE;
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

export interface PrimitiveVertexSchema {
    readonly attributes: ReadonlyArray<VertexAttributeDefinition>;
}

export type PrimitiveRuntime = Pick<
    Runtime,
    | 'gl' | 'vaoExt' | 'logger'
    | 'bindArrayBuffer' | 'bindElementArrayBuffer' | 'bindVertexArrayObject' | 'useProgram'
>;

export interface PrimitiveParams extends BaseObjectParams {
    readonly runtime: PrimitiveRuntime;
}
