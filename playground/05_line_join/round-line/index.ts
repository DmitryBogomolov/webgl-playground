import {
    Runtime, VertexWriter,
    parseVertexSchema,
    Vec2, Vec4, vec4,
} from 'lib';
import { Vertex } from '../vertex';
import { BaseLine, writeSegmentIndexes } from '../base-line';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float4' },
    { name: 'a_other', type: 'float2' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

export class RoundLine extends BaseLine {
    constructor(runtime: Runtime) {
        super(runtime, schema, vertexShaderSource, fragmentShaderSource);
    }

    protected _getVertexBufferSize(segmentSize: number, vertexCount: number): number {
        // segments <- vertices - 1
        return vertexCount > 1 ? segmentSize * (vertexCount - 1) : 0;
    }

    protected _getIndexBufferSize(vertexCount: number): number {
        // segments <- vertices - 1; 6 indices per segment
        return vertexCount > 1 ? 2 * 6 * (vertexCount - 1) : 0;
    }

    protected _writeSegmentVertices(
        writer: VertexWriter, vertices: ReadonlyArray<Vertex>, idx: number,
    ): void {
        const vertexBase = idx * 4;
        const start = vertices[idx];
        const end = vertices[idx + 1];

        const startOther = end.position;
        const endOther = start.position;
        const startColor = start.color;
        const endColor = end.color;

        writer.writeAttribute(vertexBase + 0, 'a_position', makePositionAttr(start.position, +1, -1));
        writer.writeAttribute(vertexBase + 1, 'a_position', makePositionAttr(start.position, -1, -1));
        writer.writeAttribute(vertexBase + 2, 'a_position', makePositionAttr(end.position, -1, +1));
        writer.writeAttribute(vertexBase + 3, 'a_position', makePositionAttr(end.position, +1, +1));
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
        arr: Uint16Array, _vertexCount: number, idx: number,
    ): void {
        writeSegmentIndexes(arr, idx * 6, idx * 4);
    }

    protected _getSegmentRange(vertexCount: number, vertexIdx: number): [number, number] {
        return [Math.max(vertexIdx - 1, 0), Math.min(vertexIdx, vertexCount - 2)];
    }
}

function makePositionAttr(position: Vec2, crossSide: number, lateralSide: number): Vec4 {
    return vec4(position.x, position.y, crossSide, lateralSide);
}
