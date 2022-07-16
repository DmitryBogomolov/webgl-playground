import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    Vec3,
    vec3,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

const PARTITION = 2;

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const { vertices, indices } = generateData();
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i]);
    }
    const indexData = new Uint16Array(indices);


    primitive.setProgram(program);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setIndexCount(indexData.length);

    return primitive;
}

function generateData(): { vertices: Vec3[], indices: number[] } {
    const vertices: Vec3[] = [];
    const indices: number[] = [];

    const step = Math.PI / PARTITION;
    // const latCount = PARTITION + 1;
    const lonCount = 2 * PARTITION;

    vertices.push(vec3(0, 1, 0));
    const firstIdx = 0;
    const y = Math.cos(step);
    const zx = Math.sin(step);
    const idx = 1;
    for (let i = 0; i < lonCount; ++i) {
        const z = Math.cos(i * step) * zx;
        const x = Math.sin(i * step) * zx;
        vertices.push(vec3(x, y, z));
        indices.push(firstIdx, idx + i, idx + (i + 1) % lonCount);
    }
    vertices.push(vec3(0, -1, 0));
    const lastIdx = vertices.length - 1;
    for (let i = 0; i < lonCount; ++i) {
        indices.push(lastIdx, idx + (i + 1) % lonCount, idx + i);
    }

    return { vertices, indices };
}
