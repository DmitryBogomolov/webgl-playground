import {
    Runtime, VertexWriter,
    parseVertexSchema,
    Vec2, Vec3, Vec4, vec3, vec4,
} from 'lib';
import { Vertex } from '../vertex';
import { BaseLine, writeSegmentIndexes } from '../base-line';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float3' },
    { name: 'a_other', type: 'float4' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

export class BevelLine extends BaseLine {
    constructor(runtime: Runtime) {
        super(runtime, schema, vertexShaderSource, fragmentShaderSource);
    }

    protected _getVertexBufferSize(segmentSize: number, vertexCount: number): number {
        // segments <- vertices - 1
        return vertexCount > 1 ? segmentSize * (vertexCount - 1) : 0;
    }

    protected _getIndexBufferSize(vertexCount: number): number {
        // segments <- vertices - 1; 6 indices per segment and 6 indices per segment join
        return vertexCount > 1 ? 2 * 6 * (2 * (vertexCount - 1) - 1) : 0;
    }

    protected _writeSegmentVertices(
        writer: VertexWriter, vertices: ReadonlyArray<Vertex>, idx: number,
    ): void {
        const vertexBase = idx * 4;
        const start = vertices[idx];
        const end = vertices[idx + 1];
        const before = vertices[idx - 1] || end;
        const after = vertices[idx + 2] || start;

        const startOther = makeOtherAttr(end.position, before.position);
        const endOther = makeOtherAttr(start.position, after.position);
        const startColor = start.color;
        const endColor = end.color;

        writer.writeAttribute(vertexBase + 0, 'a_position', makePositionAttr(start.position, +1));
        writer.writeAttribute(vertexBase + 1, 'a_position', makePositionAttr(start.position, -1));
        writer.writeAttribute(vertexBase + 2, 'a_position', makePositionAttr(end.position, -1));
        writer.writeAttribute(vertexBase + 3, 'a_position', makePositionAttr(end.position, +1));
        writer.writeAttribute(vertexBase + 0, 'a_other', startOther);
        writer.writeAttribute(vertexBase + 1, 'a_other', startOther);
        writer.writeAttribute(vertexBase + 2, 'a_other', endOther);
        writer.writeAttribute(vertexBase + 3, 'a_other', endOther);
        writer.writeAttribute(vertexBase + 0, 'a_color', startColor);
        writer.writeAttribute(vertexBase + 1, 'a_color', startColor);
        writer.writeAttribute(vertexBase + 2, 'a_color', endColor);
        writer.writeAttribute(vertexBase + 3, 'a_color', endColor);
    }

    protected _writeSegmentIndexes(
        arr: Uint16Array, vertexCount: number, idx: number,
    ): void {
        writeSegmentIndexes(arr, idx * 12, idx * 4);
        if (idx < vertexCount - 1) {
            writeSegmentIndexes(arr, idx * 12 + 6, idx * 4 + 2);
        }
    }

    protected _getSegmentRange(vertexCount: number, vertexIdx: number): [number, number] {
        return [Math.max(vertexIdx - 2, 0), Math.min(vertexIdx + 1, vertexCount - 2)];
    }
}

function makePositionAttr(position: Vec2, side: number): Vec3 {
    return vec3(position.x, position.y, side);
}

function makeOtherAttr(other: Vec2, outer: Vec2): Vec4 {
    return vec4(other.x, other.y, outer.x, outer.y);
}
