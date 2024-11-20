import type { Runtime, VertexData, VertexIndexData } from 'lib';
import {
    Primitive,
    Program,
    vec2,
    vec3,
    generateSphere, generateCube, generatePlaneZ, VertexWriter,
    parseVertexSchema,
} from 'lib';
import vertShader from './shaders/mapping.vert';
import fragShader from './shaders/mapping.frag';
import wireframeVertShader from './shaders/wireframe.vert';
import wireframeFragShader from './shaders/wireframe.frag';

export function makeProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader,
        fragShader,
    });
}

function makePrimitive(
    runtime: Runtime, program: Program, { vertices, indices }: VertexIndexData<VertexData>,
): Primitive {
    const primitive = new Primitive({ runtime });
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float2' },
        ],
    });
    const VERTEX_SIZE = 20;

    const vertexData = new ArrayBuffer(vertices.length * VERTEX_SIZE);
    const writer = new VertexWriter(vertexSchema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, texcoord } = vertices[i];
        writer.writeAttribute(i, 0, position);
        writer.writeAttribute(i, 1, texcoord);
    }
    const indexData = new Uint16Array(indices);

    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);

    return primitive;
}

export function makeSphere(runtime: Runtime, program: Program): Primitive {
    return makePrimitive(
        runtime,
        program,
        generateSphere(vec3(2, 2, 2), (vertex) => vertex, 8),
    );
}

export function makeEllipse(runtime: Runtime, program: Program): Primitive {
    return makePrimitive(
        runtime,
        program,
        generateSphere(vec3(2, 1.8, 1.6), (vertex) => vertex, 8),
    );
}

export function makeCube(runtime: Runtime, program: Program): Primitive {
    return makePrimitive(
        runtime,
        program,
        generateCube(vec3(2, 2, 2), (vertex) => vertex),
    );
}

export function makePlane(runtime: Runtime, program: Program): Primitive {
    return makePrimitive(
        runtime,
        program,
        generatePlaneZ(vec2(2, 2), (vertex) => vertex),
    );
}

export function makeWireframe(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });

    const vertexData = new Float32Array([
        -1, -1, +1,
        +1, -1, +1,
        +1, +1, +1,
        -1, +1, +1,
        -1, -1, -1,
        +1, -1, -1,
        +1, +1, -1,
        -1, +1, -1,
    ]);
    const indexData = new Uint16Array([
        0, 1, 1, 2, 2, 3, 3, 0,
        0, 4, 1, 5, 2, 6, 3, 7,
        4, 5, 5, 6, 6, 7, 7, 4,
    ]);
    const vertexSchema = parseVertexSchema({
        attributes: [{ type: 'float3' }],
    });

    primitive.setup({ vertexData, indexData, vertexSchema, primitiveMode: 'lines' });

    const program = new Program({
        runtime,
        vertShader: wireframeVertShader,
        fragShader: wireframeFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
