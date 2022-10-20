import type { GlyphAtlas } from './glyph';
import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
} from 'lib';
import vertShader from './shaders/label.vert';
import fragShader from './shaders/label.frag';

export function makeStringPrimitive(runtime: Runtime, atlas: GlyphAtlas, text: string): Primitive {
    const vertexData = new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
    ]);
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
        // { name: 'a_texcoord', type: 'float2' },
    ]);

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
