import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema, VertexWriter,
    vec3,
    generateSphere,
} from 'lib';
import vertexShader from './shaders/mapping.vert';
import fragmentShader from './shaders/mapping.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
    ]);

    const { vertices, indices } = generateSphere(vec3(2, 2, 2), (position) => position, 8);
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i]);
    }
    const indexData = new Uint16Array(indices);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertexShader,
        fragmentShader,
        schema,
    });

    primitive.setProgram(program);

    return primitive;
}
