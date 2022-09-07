import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    VertexIndexData, VertexData, generateCube, generateSphere,
    vec3,
} from 'lib';
import colorVertShader from './shaders/color.vert';
import colorFragShader from './shaders/color.frag';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float3' },
    { name: 'a_normal', type: 'float3' },
]);

function make(runtime: Runtime, { vertices, indices }: VertexIndexData<VertexData>): Primitive {
    const primitive = new Primitive(runtime);
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_normal', vertices[i].normal);
    }
    const indexData = new Uint16Array(indices);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setIndexData({ indexCount: indexData.length });
    return primitive;
}

export function makeColorProgram(runtime: Runtime): Program {
    return new Program(runtime, {
        vertexShader: colorVertShader,
        fragmentShader: colorFragShader,
        schema,
    });
}

export function makeSphere(runtime: Runtime): Primitive {
    return make(runtime, generateSphere(vec3(3, 3, 3), (vertex) => vertex));
}

export function makeCube(runtime: Runtime): Primitive {
    return make(runtime, generateCube(vec3(1, 1, 1), (vertex) => vertex));
}
