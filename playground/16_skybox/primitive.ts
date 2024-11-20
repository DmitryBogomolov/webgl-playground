import type { Runtime } from 'lib';
import { Primitive, Program, generateCube, UNIT3, parseVertexSchema, writeVertexData } from 'lib';
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
    const vertexSchema = parseVertexSchema({
        attributes: [{ type: 'float2' }],
    });

    const primitive = new Primitive({ runtime });
    primitive.setup({ vertexData, indexData, vertexSchema });

    const program = new Program({
        runtime,
        vertShader: skyboxVertShader,
        fragShader: skyboxFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeCube(runtime: Runtime): Primitive {
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
        vertShader: reflectVertShader,
        fragShader: reflectFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
