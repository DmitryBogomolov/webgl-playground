import type { Runtime, Vec2, Vec4 } from 'lib';
import type { LineParams } from '../line';
import { parseVertexSchema, vec4 } from 'lib';
import { Line, writeSegmentIndexes } from '../line';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';

const roundParams: LineParams = {
    schema: parseVertexSchema({
        attributes: [
            { type: 'float4' },
            { type: 'float2' },
            { type: 'ubyte4', normalized: true },
        ],
    }),
    vertShader,
    fragShader,
    getVertexSize() {
        return 16 + 8 + 4;
    },
    getVertexCount(segmentCount) {
        // 4 vertices per segment.
        return 4 * segmentCount;
    },
    getIndexCount(segmentCount) {
        // 6 indices per segment.
        return 6 * segmentCount;
    },
    writeSegmentVertices(writer, vertices, segmentIdx) {
        const vertexBase = segmentIdx * 4;
        const start = vertices[segmentIdx];
        const end = vertices[segmentIdx + 1];

        const startOther = end.position;
        const endOther = start.position;
        const startColor = start.color;
        const endColor = end.color;

        writer.writeAttribute(vertexBase + 0, 0, makePositionAttr(start.position, +1, -1));
        writer.writeAttribute(vertexBase + 1, 0, makePositionAttr(start.position, -1, -1));
        writer.writeAttribute(vertexBase + 2, 0, makePositionAttr(end.position, -1, +1));
        writer.writeAttribute(vertexBase + 3, 0, makePositionAttr(end.position, +1, +1));
        writer.writeAttribute(vertexBase + 0, 1, startOther);
        writer.writeAttribute(vertexBase + 1, 1, startOther);
        writer.writeAttribute(vertexBase + 2, 1, endOther);
        writer.writeAttribute(vertexBase + 3, 1, endOther);
        writer.writeAttribute(vertexBase + 0, 2, startColor);
        writer.writeAttribute(vertexBase + 1, 2, startColor);
        writer.writeAttribute(vertexBase + 2, 2, endColor);
        writer.writeAttribute(vertexBase + 3, 2, endColor);
    },
    writeSegmentIndexes(arr, _vertexCount, segmentIdx) {
        writeSegmentIndexes(arr, segmentIdx * 6, segmentIdx * 4);
    },
    getSegmentRange(vertexCount, vertexIdx) {
        return [Math.max(vertexIdx - 1, 0), Math.min(vertexIdx, vertexCount - 2)];
    },
};

export class RoundLine extends Line {
    constructor(runtime: Runtime) {
        super(runtime, roundParams);
    }
}

function makePositionAttr(position: Vec2, crossSide: number, lateralSide: number): Vec4 {
    return vec4(position.x, position.y, crossSide, lateralSide);
}
