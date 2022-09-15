import {
    Runtime,
    parseVertexSchema,
    Vec2, Vec3, Vec4, vec3, vec4,
} from 'lib';
import { Line, LineParams, writeSegmentIndexes } from '../line';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float3' },
    { name: 'a_other', type: 'float4' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

const bevelParams: LineParams = {
    schema,
    vertexShader: vertShader,
    fragmentShader: fragShader,
    getVertexCount(segmentCount) {
        // 4 vertices per segment.
        return 4 * segmentCount;
    },
    getIndexCount(segmentCount) {
        // 6 indices per segment and 6 indices per segment join.
        return 6 * (2 * segmentCount - 1);
    },
    writeSegmentVertices(writer, vertices, segmentIdx) {
        const vertexBase = segmentIdx * 4;
        const start = vertices[segmentIdx];
        const end = vertices[segmentIdx + 1];
        const before = vertices[segmentIdx - 1] || end;
        const after = vertices[segmentIdx + 2] || start;

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
    },
    writeSegmentIndexes(arr, vertexCount, segmentIdx) {
        writeSegmentIndexes(arr, segmentIdx * 12, segmentIdx * 4);
        if (segmentIdx < vertexCount - 1) {
            writeSegmentIndexes(arr, segmentIdx * 12 + 6, segmentIdx * 4 + 2);
        }
    },
    getSegmentRange(vertexCount, vertexIdx) {
        return [Math.max(vertexIdx - 2, 0), Math.min(vertexIdx + 1, vertexCount - 2)];
    },
};

export class BevelLine extends Line {
    constructor(runtime: Runtime) {
        super(runtime, bevelParams);
    }
}

function makePositionAttr(position: Vec2, side: number): Vec3 {
    return vec3(position.x, position.y, side);
}

function makeOtherAttr(other: Vec2, outer: Vec2): Vec4 {
    return vec4(other.x, other.y, outer.x, outer.y);
}
