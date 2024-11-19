import type { VertexSchemaDefinition, Runtime, VertexData, VertexIndexData } from 'lib';
import {
    Primitive,
    Program,
    generateCube, generateSphere,
    UNIT3, mul3, VertexWriter,
} from 'lib';
import sceneVertShader from './shaders/scene.vert';
import sceneFragShader from './shaders/scene.frag';
import depthVertShader from './shaders/depth.vert';
import depthFragShader from './shaders/depth.frag';
import wireframeVertShader from './shaders/wireframe.vert';
import wireframeFragShader from './shaders/wireframe.frag';

function make(runtime: Runtime, { vertices, indices }: VertexIndexData<VertexData>): Primitive {
    const primitive = new Primitive({ runtime });
    const vertexSchema: VertexSchemaDefinition = {
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
        ],
    };
    const VERTEX_SIZE = 24;
    const vertexData = new ArrayBuffer(vertices.length * VERTEX_SIZE);
    const writer = new VertexWriter(vertexSchema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 0, vertices[i].position);
        writer.writeAttribute(i, 1, vertices[i].normal);
    }
    const indexData = new Uint16Array(indices);
    primitive.setup({ vertexData, indexData, vertexSchema });
    return primitive;
}

export function makeProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader: sceneVertShader,
        fragShader: sceneFragShader,
    });
}

export function makeDepthProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader: depthVertShader,
        fragShader: depthFragShader,
    });
}

export function makeSphere(runtime: Runtime, size: number): Primitive {
    return make(runtime, generateSphere(mul3(UNIT3, size), (vertex) => vertex, 16));
}

export function makeCube(runtime: Runtime, size: number): Primitive {
    return make(runtime, generateCube(mul3(UNIT3, size), (vertex) => vertex));
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
    const vertexSchema: VertexSchemaDefinition = {
        attributes: [{ type: 'float3' }],
    };
    primitive.setup({ vertexData, indexData, vertexSchema, primitiveMode: 'lines' });

    const program = new Program({
        runtime,
        vertShader: wireframeVertShader,
        fragShader: wireframeFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
