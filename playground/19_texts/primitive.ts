import type { Runtime } from 'lib';
import { Primitive, Program, generateCube, UNIT3, parseVertexSchema, writeVertexData } from 'lib';
import vertShader from './shaders/cube.vert';
import fragShader from './shaders/cube.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
        ],
    });
    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);

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
