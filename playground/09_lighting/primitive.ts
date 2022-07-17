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

export function makePrimitive(runtime: Runtime, partition: number, size: Vec3): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const { vertices, indices } = generateData(partition, size);
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

function generateData(partition: number, size: Vec3): { vertices: Vec3[], indices: number[] } {
    const vertices: Vec3[] = [];
    const indices: number[] = [];

    const step = Math.PI / partition;
    const lonCount = 2 * partition;
    const cosList: number[] = [];
    const sinList: number[] = [];
    for (let i = 0; i < lonCount; ++i) {
        cosList[i] = Math.cos(i * step);
        sinList[i] = Math.sin(i * step);
    }

    vertices.push(vec3(0, +size.y, 0));
    for (let i = 1; i < partition; ++i) {
        const y = size.y * cosList[i];
        const zx = sinList[i];
        for (let j = 0; j < lonCount; ++j) {
            const z = size.z * cosList[j] * zx;
            const x = size.x * sinList[j] * zx;
            vertices.push(vec3(x, y, z));
        }
    }
    vertices.push(vec3(0, -size.y, 0));

    const firstIdx = 0;
    const lastIdx = vertices.length - 1;
    let idx = 1;
    for (let j = 0; j < lonCount; ++j) {
        const j1 = (j + 1) % lonCount;
        indices.push(firstIdx, idx + j, idx + j1);
    }
    for (let i = 1; i < partition - 1; ++i) {
        for (let j = 0; j < lonCount; ++j) {
            const j1 = (j + 1) % lonCount;
            const idx1 = idx + lonCount;
            indices.push(
                idx + j, idx1 + j, idx1 + j1,
                idx1 + j1, idx + j1, idx + j,
            );
        }
        idx += lonCount;
    }
    for (let j = 0; j < lonCount; ++j) {
        const j1 = (j + 1) % lonCount;
        indices.push(lastIdx, idx + j1, idx + j);
    }

    return { vertices, indices };
}
