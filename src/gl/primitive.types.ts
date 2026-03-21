import type { Runtime } from './runtime';
import type { LogHandler } from '../common/logger.types';
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

export interface PrimitiveIndexRange {
    readonly indexOffset?: number;
    readonly indexCount?: number;
}

export type PrimitiveRuntime = Pick<
    Runtime,
    | 'gl' | 'log'
    | 'bindArrayBuffer' | 'bindElementArrayBuffer' | 'bindVertexArray' | 'useProgram'
>;

export interface PrimitiveParams {
    readonly tag?: string;
    readonly log?: LogHandler;
    readonly runtime: PrimitiveRuntime;
}
