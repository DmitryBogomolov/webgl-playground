import type { Color } from 'lib';
import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    vec3,
    color,
    generateCube,
} from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_color', type: 'ubyte3', normalized: true },
    ]);
    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
    });

    const k1 = 0.7;
    const k2 = 0.1;
    const c1 = color(k1, k1, k2);
    const c2 = color(k2, k1, k1);
    const c3 = color(k1, k2, k1);
    const c4 = color(k2, k2, k1);
    const c5 = color(k1, k2, k2);
    const c6 = color(k2, k1, k2);
    const clrs: Record<string, Color> = {
        '001': c1,
        '100': c2,
        '00-1': c3,
        '-100': c4,
        '0-10': c5,
        '010': c6,
    };
    const { vertices, indices } = generateCube(vec3(1, 0.8, 0.6), ({ position, normal }) => {
        const key = `${normal.x | 0}${normal.y | 0}${normal.z | 0}`;
        return { pos: position, clr: clrs[key] };
    });

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
    primitive.setIndexConfig({ indexCount: indexData.length });
    primitive.setProgram(program);
    return primitive;
}
