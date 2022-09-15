import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    vec2,
    UNIT3,
    generateCube, generatePlaneZ,
} from 'lib';
import objectVertShaderSource from './shaders/object.vert';
import objectFragShaderSource from './shaders/object.frag';
import texturePlaneVertShaderSource from './shaders/texture-plane.vert';
import texturePlaneFragShaderSource from './shaders/texture-plane.frag';

export function makeObject(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
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

    const program = new Program(runtime, {
        vertexShader: objectVertShaderSource,
        fragmentShader: objectFragShaderSource,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeTexturePlane(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_texcoord', type: 'float2' },
    ]);

    const { vertices, indices } = generatePlaneZ(vec2(2, 2), (vertex) => vertex);
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_texcoord', vertices[i].texcoord);
    }
    const indexData = new Uint16Array(indices);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertexShader: texturePlaneVertShaderSource,
        fragmentShader: texturePlaneFragShaderSource,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}
