import type { Runtime, Vec2, Vec3, Vec4 } from 'lib';
import {
    Primitive, Program, generateCube, UNIT3, vec3, vec4, parseVertexSchema, VertexWriter, writeVertexData,
} from 'lib';
import vertShader from './shaders/object.vert';
import fragShader from './shaders/object.frag';
import contourVertShader from './shaders/contour.vert';
import contourFragShader from './shaders/contour.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
        ],
    });

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = writeVertexData(vertices, vertexSchema, (vertex) => ([vertex.position, vertex.normal]));
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive({ runtime });
    primitive.setup({ vertexData, indexData, vertexSchema });

    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

// Cube has 6 faces. If each face contains intersection segment then there are 6 segments total.
const MAX_CONTOUR_SEGMENTS = 6;
const VERTEX_PER_SEGMENT = 4;
const INDEX_PER_SEGMENT = 6;

const contourSchema = parseVertexSchema({
    attributes: [
        { type: 'float3' },
        { type: 'float4' },
    ],
});
const CONTOUR_VERTEX_SIZE = 28;

export function makeContourPrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });
    primitive.setup({
        vertexData: CONTOUR_VERTEX_SIZE * VERTEX_PER_SEGMENT * MAX_CONTOUR_SEGMENTS,
        indexData: INDEX_PER_SEGMENT * 2 * MAX_CONTOUR_SEGMENTS,
        vertexSchema: contourSchema,
    });

    const program = new Program({
        runtime,
        vertShader: contourVertShader,
        fragShader: contourFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

interface Vertex {
    readonly position: Vec3;
    readonly other: Vec4;
}

export function updateContourData(primitive: Primitive, points: ReadonlyArray<Vec2>): void {
    const segmentCount = points.length;
    const vertices: Vertex[] = [];
    const indices: number[] = [];
    for (let i = 0; i < segmentCount; ++i) {
        const p1 = points[i];
        const p2 = points[pickIndex(i + 1, segmentCount)];
        const q1 = points[pickIndex(i - 1, segmentCount)];
        const q2 = points[pickIndex(i + 2, segmentCount)];
        const vertexIdx = VERTEX_PER_SEGMENT * i;
        const other1 = vec4(p2.x, p2.y, q1.x, q1.y);
        const other2 = vec4(p1.x, p1.y, q2.x, q2.y);        // Only half of line thickness is required, because other half overlaps figure itself.
        // Assuming that line goes CCW, right half is drawn.
        // For segment start it means 0 and +2 offsets, for segment end it means 0 and -2.
        vertices.push(
            { position: vec3(p1.x, p1.y, 0), other: other1 },
            { position: vec3(p1.x, p1.y, +2), other: other1 },
            { position: vec3(p2.x, p2.y, 0), other: other2 },
            { position: vec3(p2.x, p2.y, -2), other: other2 },
        );
        indices.push(vertexIdx + 0, vertexIdx + 1, vertexIdx + 3, vertexIdx + 3, vertexIdx + 2, vertexIdx + 0);
    }

    const vertexData = writeVertexData(vertices, contourSchema, (vertex) => ([vertex.position, vertex.other]));
    const indexData = new Uint16Array(indices);

    primitive.updateVertexData(vertexData, 0);
    primitive.updateIndexData(indexData, 0);
}

function pickIndex(i: number, length: number): number {
    return (i < 0 ? i + length : i) % length;
}
