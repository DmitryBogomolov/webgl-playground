import type { Runtime, PrimitiveVertexSchema } from 'lib';
import { Primitive, Program, VertexWriter, generateCube, UNIT3 } from 'lib';
import skyboxVertShader from './shaders/skybox.vert';
import skyboxFragShader from './shaders/skybox.frag';
import reflectVertShader from './shaders/reflect.vert';
import reflectFragShader from './shaders/reflect.frag';

export function makeQuad(runtime: Runtime): Primitive {
    const vertexData = new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
    ]);
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    const primitive = new Primitive(runtime);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema({
        attributes: [{ type: 'float2' }],
    });
    primitive.setIndexConfig({
        indexCount: indexData.length,
    });

    const program = new Program(runtime, {
        vertShader: skyboxVertShader,
        fragShader: skyboxFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeCube(runtime: Runtime): Primitive {
    const schema: PrimitiveVertexSchema = {
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
        ],
    };
    const VERTEX_SIZE = 24;

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = new ArrayBuffer(vertices.length * VERTEX_SIZE);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 0, vertices[i].position);
        writer.writeAttribute(i, 1, vertices[i].normal);
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
        vertShader: reflectVertShader,
        fragShader: reflectFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
