import type { PrimitiveVertexSchema, Runtime, VertexData, VertexIndexData } from 'lib';
import {
    Primitive,
    Program,
    vec2,
    vec3,
    generateSphere, generateCube, generatePlaneZ, VertexWriter,
} from 'lib';
import vertShader from './shaders/mapping.vert';
import fragShader from './shaders/mapping.frag';
import wireframeVertShader from './shaders/wireframe.vert';
import wireframeFragShader from './shaders/wireframe.frag';

export function makeProgram(runtime: Runtime): Program {
    return new Program(runtime, {
        vertShader,
        fragShader,
    });
}

function makePrimitive(
    runtime: Runtime, program: Program, { vertices, indices }: VertexIndexData<VertexData>,
): Primitive {
    const primitive = new Primitive(runtime);
    const schema: PrimitiveVertexSchema = {
        attributes: [
            { type: 'float3' },
            { type: 'float2' },
        ],
    };
    const VERTEX_SIZE = 20;

    const vertexData = new ArrayBuffer(vertices.length * VERTEX_SIZE);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, texcoord } = vertices[i];
        writer.writeAttribute(i, 0, position);
        writer.writeAttribute(i, 1, texcoord);
    }
    const indexData = new Uint16Array(indices);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexConfig({ indexCount: indexData.length });
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
    const primitive = new Primitive(runtime);

    const vertices = new Float32Array([
        -1, -1, +1,
        +1, -1, +1,
        +1, +1, +1,
        -1, +1, +1,
        -1, -1, -1,
        +1, -1, -1,
        +1, +1, -1,
        -1, +1, -1,
    ]);
    const indices = new Uint16Array([
        0, 1, 1, 2, 2, 3, 3, 0,
        0, 4, 1, 5, 2, 6, 3, 7,
        4, 5, 5, 6, 6, 7, 7, 4,
    ]);

    primitive.allocateVertexBuffer(vertices.byteLength);
    primitive.updateVertexData(vertices);
    primitive.allocateIndexBuffer(indices.byteLength);
    primitive.updateIndexData(indices);
    primitive.setVertexSchema({
        attributes: [{ type: 'float3' }],
    });
    primitive.setIndexConfig({
        indexCount: indices.length,
        primitiveMode: 'lines',
    });

    const program = new Program(runtime, {
        vertShader: wireframeVertShader,
        fragShader: wireframeFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
