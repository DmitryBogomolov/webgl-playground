import type { Runtime, PrimitiveVertexSchema } from 'lib';
import { Primitive, Program, VertexWriter, generateCube, UNIT3 } from 'lib';
import vertShader from './shaders/cube.vert';
import fragShader from './shaders/cube.frag';

export function makePrimitive(runtime: Runtime): Primitive {
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

    const primitive = new Primitive({ runtime });
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexConfig({ indexCount: indexData.length });

    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
