import type { Runtime, Vec2 } from 'lib';
import {
    Primitive, Program, generateCube, UNIT3, vec3, vec4, parseVertexSchema, writeVertexData,
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

    const { vertices, indices } = generateCube(UNIT3, eigen);
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

function eigen<T>(t: T): T {
    return t;
}

// Cube has 6 faces. If each face contains intersection segment then there are 6 segments total.
const MAX_CONTOUR_SEGMENTS = 6;
const VERTEX_PER_SEGMENT = 4;
const INDEX_PER_SEGMENT = 6;

const contourVertexSchema = parseVertexSchema({
    attributes: [
        { type: 'float3' },
        { type: 'float4' },
    ],
});

const vertexDataBuffer = new Uint8Array(contourVertexSchema.vertexSize * VERTEX_PER_SEGMENT * MAX_CONTOUR_SEGMENTS);

export function makeContourPrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });
    primitive.setup({
        vertexData: vertexDataBuffer.byteLength,
        indexData: generateContourIndices(),
        vertexSchema: contourVertexSchema,
    });

    const program = new Program({
        runtime,
        vertShader: contourVertShader,
        fragShader: contourFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

export function updateContourData(primitive: Primitive, points: ReadonlyArray<Vec2>): void {
    const segmentCount = points.length;
    const vertexData = writeVertexData(
        {
            length: segmentCount * 4,
            *[Symbol.iterator]() {
                for (let i = 0; i < segmentCount; ++i) {
                    const p1 = points[i];
                    const p2 = points[pickIndex(i + 1, segmentCount)];
                    const q1 = points[pickIndex(i - 1, segmentCount)];
                    const q2 = points[pickIndex(i + 2, segmentCount)];
                    const other1 = vec4(p2.x, p2.y, q1.x, q1.y);
                    const other2 = vec4(p1.x, p1.y, q2.x, q2.y);
                    // Only half of line thickness is required, because other half overlaps figure itself.
                    // Assuming that line goes CCW, right half is drawn.
                    // For segment start it means 0 and +2 offsets, for segment end it means 0 and -2.
                    yield [vec3(p1.x, p1.y, 0), other1];
                    yield [vec3(p1.x, p1.y, +2), other1];
                    yield [vec3(p2.x, p2.y, 0), other2];
                    yield [vec3(p2.x, p2.y, -2), other2];
                }
            },
        },
        contourVertexSchema,
        eigen,
        vertexDataBuffer,
    );

    primitive.updateVertexData(vertexData, 0);
    primitive.updateIndexRange({ indexCount: segmentCount * INDEX_PER_SEGMENT });
}

function generateContourIndices(): Uint16Array {
    const indices: number[] = [];
    for (let i = 0; i < MAX_CONTOUR_SEGMENTS; ++i) {
        const vertexIdx = VERTEX_PER_SEGMENT * i;
        indices.push(vertexIdx + 0, vertexIdx + 1, vertexIdx + 3, vertexIdx + 3, vertexIdx + 2, vertexIdx + 0);
    }
    return new Uint16Array(indices);
}

function pickIndex(i: number, length: number): number {
    return (i < 0 ? i + length : i) % length;
}
