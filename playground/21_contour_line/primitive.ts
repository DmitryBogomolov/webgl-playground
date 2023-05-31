import type { Runtime, Vec2 } from 'lib';
import {
    Primitive,
    Program,
    generateCube,
    parseVertexSchema,
    VertexWriter,
    UNIT3, vec3,
    vec4,
} from 'lib';
import vertShader from './shaders/object.vert';
import fragShader from './shaders/object.frag';
import contourVertShader from './shaders/contour.vert';
import contourFragShader from './shaders/contour.frag';


export function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = new ArrayBuffer(schema.totalSize * vertices.length);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_normal', vertices[i].normal);
    }
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive(runtime);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexConfig({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

// Cube has 6 faces. If each face contains intersection segment then there are 6 segments total.
const MAX_CONTOUR_SEGMENTS = 6;
const VERTEX_PER_SEGMENT = 4;
const INDEX_PER_SEGMENT = 6;

export function makeControurPrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_other', type: 'float4' },
    ]);

    const primitive = new Primitive(runtime);
    primitive.allocateVertexBuffer(schema.totalSize * VERTEX_PER_SEGMENT * MAX_CONTOUR_SEGMENTS);
    primitive.allocateIndexBuffer(INDEX_PER_SEGMENT * 2 * MAX_CONTOUR_SEGMENTS);
    primitive.setVertexSchema(schema);

    const program = new Program(runtime, {
        vertShader: contourVertShader,
        fragShader: contourFragShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

export function updateContourData(primitive: Primitive, points: ReadonlyArray<Vec2>): void {
    const segmentCount = points.length;
    const vertexData = new ArrayBuffer(segmentCount * primitive.schema().totalSize * VERTEX_PER_SEGMENT);
    const indexData = new Uint16Array(segmentCount * INDEX_PER_SEGMENT);
    const vertexWriter = new VertexWriter(primitive.schema(), vertexData);
    for (let i = 0; i < segmentCount; ++i) {
        const p1 = points[i];
        const p2 = points[pickIndex(i + 1, segmentCount)];
        const q1 = points[pickIndex(i - 1, segmentCount)];
        const q2 = points[pickIndex(i + 2, segmentCount)];
        const vertexIdx = VERTEX_PER_SEGMENT * i;
        // Only half of line thickness is required, because other half overlaps figure itself.
        // Assuming that line goes CCW, right half is drawn.
        // For segment start it means 0 and +2 offsets, for segment end it means 0 and -2.
        vertexWriter.writeAttribute(vertexIdx + 0, 'a_position', vec3(p1.x, p1.y, 0));
        vertexWriter.writeAttribute(vertexIdx + 1, 'a_position', vec3(p1.x, p1.y, +2));
        vertexWriter.writeAttribute(vertexIdx + 2, 'a_position', vec3(p2.x, p2.y, 0));
        vertexWriter.writeAttribute(vertexIdx + 3, 'a_position', vec3(p2.x, p2.y, -2));
        const other1 = vec4(p2.x, p2.y, q1.x, q1.y);
        const other2 = vec4(p1.x, p1.y, q2.x, q2.y);
        vertexWriter.writeAttribute(vertexIdx + 0, 'a_other', other1);
        vertexWriter.writeAttribute(vertexIdx + 1, 'a_other', other1);
        vertexWriter.writeAttribute(vertexIdx + 2, 'a_other', other2);
        vertexWriter.writeAttribute(vertexIdx + 3, 'a_other', other2);
        const indexIdx = INDEX_PER_SEGMENT * i;
        indexData.set(
            [vertexIdx + 0, vertexIdx + 1, vertexIdx + 3, vertexIdx + 3, vertexIdx + 2, vertexIdx + 0],
            indexIdx,
        );
    }

    primitive.updateVertexData(vertexData);
    primitive.updateIndexData(indexData);
    primitive.setIndexConfig({ indexCount: indexData.length, primitiveMode: 'triangles' });
}

function pickIndex(i: number, length: number): number {
    return (i < 0 ? i + length : i) % length;
}
