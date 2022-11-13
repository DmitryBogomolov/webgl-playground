import {
    Runtime,
    Primitive,
    Program,
    generateCube,
    parseVertexSchema,
    VertexWriter,
    UNIT3,
} from 'lib';
import vertShader from './shader/object.vert';
import fragShader from './shader/object.frag';
import contourVertShader from './shader/contour.vert';
import contourFragShader from './shader/contour.frag';


export function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = new ArrayBuffer(schema.totalSize * vertices.length);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_normal', vertices[i].normal);
    }
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive(runtime);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeControurPrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);

    const primitive = new Primitive(runtime);
    primitive.allocateVertexBuffer(schema.totalSize * 8);
    primitive.allocateIndexBuffer(2 * 8 * 4);
    primitive.setVertexSchema(schema);

    const program = new Program(runtime, {
        vertShader: contourVertShader,
        fragShader: contourFragShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}
