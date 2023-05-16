import type { Runtime, Vec2, Vec4 } from 'lib';
import { parseVertexSchema, vec4 } from 'lib';
import { Line, LineParams, writeSegmentIndexes } from '../line';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float4' },
    { name: 'a_other', type: 'float2' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

const roundParams: LineParams = {
    schema,
    vertShader,
    fragShader,
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
