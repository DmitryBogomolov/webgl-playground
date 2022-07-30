import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
} from 'lib';
import vertexShader from './shaders/texture.vert';
import fragmentShader from './shaders/texture.frag';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float2' },
]);

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const vertices = new Float32Array([
        -0.5, -0.5,
        +0.5, -0.5,
        +0.5, +0.5,
        -0.5, +0.5,
    ]);
    const indices = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);
    primitive.allocateVertexBuffer(vertices.byteLength);
    primitive.updateVertexData(vertices);
    primitive.allocateIndexBuffer(indices.byteLength);
    primitive.updateIndexData(indices);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indices.length });

    const program = new Program(runtime, {
        vertexShader,
        fragmentShader,
        schema,
    });
    primitive.setProgram(program);
    return primitive;
}