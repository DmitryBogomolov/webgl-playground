import type { PrimitiveVertexSchema, Runtime, Vec3 } from 'lib';
import { Primitive, Program, generateSphere, VertexWriter } from 'lib';
import directionalVertShader from './shaders/directional.vert';
import directionalFragShader from './shaders/directional.frag';
import pointVertShader from './shaders/point.vert';
import pointFragShader from './shaders/point.frag';
import spotVertShader from './shaders/spot.vert';
import spotFragShader from './shaders/spot.frag';

const vertexSchema: PrimitiveVertexSchema = {
    attributes: [
        { type: 'float3' },
        { type: 'float3' },
    ],
};
const VERTEX_SIZE = 24;

export function makeDirectionalProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader: directionalVertShader,
        fragShader: directionalFragShader,
    });
}

export function makePointProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader: pointVertShader,
        fragShader: pointFragShader,
    });
}

export function makeSpotProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader: spotVertShader,
        fragShader: spotFragShader,
    });
}

export function makePrimitive(runtime: Runtime, partition: number, size: Vec3): Primitive {
    const primitive = new Primitive({ runtime });

    const { vertices, indices } = generateSphere(size, ({ position, normal }) => ({ position, normal }), partition);

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
