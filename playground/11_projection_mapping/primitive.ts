import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema, VertexWriter,
    vec2,
    vec3,
    generateSphere,
} from 'lib';
import vertexShader from './shaders/mapping.vert';
import fragmentShader from './shaders/mapping.frag';
import wireframeVertexShader from './shaders/wireframe.vert';
import wireframeFragmentShader from './shaders/wireframe.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_texcoord', type: 'float2' },
    ]);

    const { vertices, indices } = generateSphere(vec3(2, 2, 2), (position, normal) => {
        // TODO: Move it to "generateSphere".
        const v = 1 - Math.acos(normal.y) / Math.PI;
        const a: number = normal.x >= 0 ? Math.atan2(normal.x, normal.z) : Math.PI + Math.atan2(-normal.x, -normal.z);
        const u = a / (2 * Math.PI);
        return { position, texcoord: vec2(u, v) };
    }, 8);
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, texcoord } = vertices[i];
        writer.writeAttribute(i, 'a_position', position);
        writer.writeAttribute(i, 'a_texcoord', texcoord);
    }
    const indexData = new Uint16Array(indices);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertexShader,
        fragmentShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeWireframe(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
    ]);

    const t = 0.5;
    const vertices = new Float32Array([
        -t, -t, +t,
        +t, -t, +t,
        +t, +t, +t,
        -t, +t, +t,
        -t, -t, -t,
        +t, -t, -t,
        +t, +t, -t,
        -t, +t, -t,
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
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indices.length, primitiveMode: 'lines' });

    const program = new Program(runtime, {
        vertexShader: wireframeVertexShader,
        fragmentShader: wireframeFragmentShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}
