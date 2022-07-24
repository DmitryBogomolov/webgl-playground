import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    Vec3,
    vec3,
    Color,
    color,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_color', type: 'ubyte3', normalized: true },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const dx = 0.5;
    const dy = 0.4;
    const dz = 0.3;
    const k1 = 0.7;
    const k2 = 0.1;
    const c1 = color(k1, k1, k2);
    const c2 = color(k2, k1, k1);
    const c3 = color(k1, k2, k1);
    const c4 = color(k2, k2, k1);
    const c5 = color(k1, k2, k2);
    const c6 = color(k2, k1, k2);
    const vertices: { pos: Vec3, clr: Color }[] = [
        // front
        { pos: vec3(-dx, -dy, +dz), clr: c1 },
        { pos: vec3(+dx, -dy, +dz), clr: c1 },
        { pos: vec3(+dx, +dy, +dz), clr: c1 },
        { pos: vec3(-dx, +dy, +dz), clr: c1 },
        // right
        { pos: vec3(+dx, -dy, +dz), clr: c2 },
        { pos: vec3(+dx, -dy, -dz), clr: c2 },
        { pos: vec3(+dx, +dy, -dz), clr: c2 },
        { pos: vec3(+dx, +dy, +dz), clr: c2 },
        // back
        { pos: vec3(+dx, -dy, -dz), clr: c3 },
        { pos: vec3(-dx, -dy, -dz), clr: c3 },
        { pos: vec3(-dx, +dy, -dz), clr: c3 },
        { pos: vec3(+dx, +dy, -dz), clr: c3 },
        // left
        { pos: vec3(-dx, -dy, -dz), clr: c4 },
        { pos: vec3(-dx, -dy, +dz), clr: c4 },
        { pos: vec3(-dx, +dy, +dz), clr: c4 },
        { pos: vec3(-dx, +dy, -dz), clr: c4 },
        // bottom
        { pos: vec3(-dx, -dy, -dz), clr: c5 },
        { pos: vec3(+dx, -dy, -dz), clr: c5 },
        { pos: vec3(+dx, -dy, +dz), clr: c5 },
        { pos: vec3(-dx, -dy, +dz), clr: c5 },
        // top
        { pos: vec3(-dx, +dy, +dz), clr: c6 },
        { pos: vec3(+dx, +dy, +dz), clr: c6 },
        { pos: vec3(+dx, +dy, -dz), clr: c6 },
        { pos: vec3(-dx, +dy, -dz), clr: c6 },
    ];
    const indices: number[] = [];
    for (let i = 0; i < 6; ++i) {
        const b = i * 4;
        indices.push(b + 0, b + 1, b + 2, b + 2, b + 3, b + 0);
    }

    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { pos, clr } = vertices[i];
        writer.writeAttribute(i, 'a_position', pos);
        writer.writeAttribute(i, 'a_color', clr);
    }

    const indexData = new Uint16Array(indices);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });
    primitive.setProgram(program);
    return primitive;
}
