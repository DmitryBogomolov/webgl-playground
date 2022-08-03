import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    Vec3,
    generateSphere,
} from 'lib';
import directionalVertexShaderSource from './shaders/directional.vert';
import directionalFragmentShaderSource from './shaders/directional.frag';
import pointVertexShaderSource from './shaders/point.vert';
import pointFragmentShaderSource from './shaders/point.frag';
import spotVertexShaderSource from './shaders/spot.vert';
import spotFragmentShaderSource from './shaders/spot.frag';

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float3' },
    { name: 'a_normal', type: 'float3' },
]);

export function makeDirectionalProgram(runtime: Runtime): Program {
    return new Program(runtime, {
        vertexShader: directionalVertexShaderSource,
        fragmentShader: directionalFragmentShaderSource,
        schema,
    });
}

export function makePointProgram(runtime: Runtime): Program {
    return new Program(runtime, {
        vertexShader: pointVertexShaderSource,
        fragmentShader: pointFragmentShaderSource,
        schema,
    });
}

export function makeSpotProgram(runtime: Runtime): Program {
    return new Program(runtime, {
        vertexShader: spotVertexShaderSource,
        fragmentShader: spotFragmentShaderSource,
        schema,
    });
}

export function makePrimitive(runtime: Runtime, partition: number, size: Vec3): Primitive {
    const primitive = new Primitive(runtime);

    const { vertices, indices } = generateSphere(size, (position, normal) => ({ position, normal }), partition);

    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_normal', vertices[i].normal);
    }
    const indexData = new Uint16Array(indices);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    return primitive;
}
