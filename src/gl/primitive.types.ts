import type { Runtime } from './runtime';
import type { BaseObjectParams } from './base-object.types';
import type { VertexSchemaInfo } from './vertex-schema.types';

export type INDEX_TYPE = (
    'ubyte' | 'ushort' | 'uint'
);

export type PRIMITIVE_MODE = (
    'points' | 'line_strip' | 'line_loop' | 'lines' | 'triangle_strip' | 'triangle_fan' | 'triangles'
);

export interface PrimitiveConfig {
    readonly vertexData: BufferSource | number;
    readonly indexData: BufferSource | number;
    readonly vertexSchema: VertexSchemaInfo;
    readonly indexType?: INDEX_TYPE;
    readonly primitiveMode?: PRIMITIVE_MODE;
}

export type PrimitiveRuntime = Pick<
    Runtime,
    | 'gl' | 'vaoExt' | 'logger'
    | 'bindArrayBuffer' | 'bindElementArrayBuffer' | 'bindVertexArrayObject' | 'useProgram'
>;

export interface PrimitiveParams extends BaseObjectParams {
    readonly runtime: PrimitiveRuntime;
}
