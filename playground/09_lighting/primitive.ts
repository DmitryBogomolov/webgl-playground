import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    Vec3,
    vec3, cross3, norm3,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

interface Vertex {
    readonly position: Vec3;
    readonly normal: Vec3;
}

export function makePrimitive(runtime: Runtime, partition: number, size: Vec3): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const { vertices, indices } = generateData(partition, size);

    console.log('###');
    console.log(vertices);
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_normal', vertices[i].normal);
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

function generateData(partition: number, size: Vec3): { vertices: Vertex[], indices: number[] } {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const step = Math.PI / partition;
    const lonCount = 2 * partition;
    const cosList: number[] = [];
    const sinList: number[] = [];
    for (let i = 0; i < lonCount; ++i) {
        cosList[i] = Math.cos(i * step);
        sinList[i] = Math.sin(i * step);
    }

    vertices.push({ position: vec3(0, +size.y, 0), normal: vec3(0, +1, 0) });
    for (let i = 1; i < partition; ++i) {
        for (let j = 0; j < lonCount; ++j) {
            const position = vec3(
                size.x * sinList[i] * sinList[j],
                size.y * cosList[i],
                size.z * sinList[i] * cosList[j],
            );

            const v1 = vec3(
                size.x * +cosList[i] * sinList[j],
                size.y * -sinList[i],
                size.z * +cosList[i] * cosList[j],
            );
            const v2 = vec3(
                size.x * sinList[i] * +cosList[j],
                0,
                size.z * sinList[i] * -sinList[j],
            );
            const normal = norm3(cross3(v1, v2));

            vertices.push({ position, normal });
        }
    }
    vertices.push({ position: vec3(0, -size.y, 0), normal: vec3(0, -1, 0) });

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
