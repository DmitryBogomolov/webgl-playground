import type { GlyphAtlas } from './glyph';
import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    Vec2, vec2,
} from 'lib';
import vertShader from './shaders/label.vert';
import fragShader from './shaders/label.frag';

export function makeStringPrimitive(runtime: Runtime, atlas: GlyphAtlas, text: string): {
    primitive: Primitive,
    size: Vec2,
} {
    let fullWidth = 0;
    let fullHeight = 0;
    for (let i = 0; i < text.length; ++i) {
        const { size } = atlas.glyphs.get(text.charCodeAt(i))!;
        fullWidth += size.x;
        fullHeight = Math.max(fullHeight, size.y);
    }
    const vertices: number[] = [];
    const indices: number[] = [];
    const { width: atlasWidth, height: atlasHeight } = atlas.canvas;
    let xOffset = -1;
    for (let i = 0; i < text.length; ++i) {
        const glyph = atlas.glyphs.get(text.charCodeAt(i))!;
        const x1 = xOffset;
        const x2 = xOffset + 2 * glyph.size.x / fullWidth;
        const y1 = -1;
        const y2 = +1;
        const u1 = glyph.coord.x / atlasWidth;
        const u2 = (glyph.coord.x + glyph.size.x) / atlasWidth;
        const v1 = 1 - (glyph.coord.y + glyph.size.y) / atlasHeight;
        const v2 = 1 - glyph.coord.y / atlasHeight;
        xOffset = x2;

        vertices.push(
            x1, y1, u1, v1,
            x2, y1, u2, v1,
            x2, y2, u2, v2,
            x1, y2, u1, v2,
        );
        const idx = i * 4;
        indices.push(
            idx + 0, idx + 1, idx + 2,
            idx + 2, idx + 3, idx + 0,
        );

    }

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
        { name: 'a_texcoord', type: 'float2' },
    ]);
    const vertexData = new Float32Array(vertices);
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

    return { primitive, size: vec2(fullWidth, fullHeight) };
}

const LABELS_POOL = [
    'anna',
    'colin',
    'james',
    'danny',
    'kalin',
    'hiro',
    'eddie',
    'shu',
    'brian',
    'tami',
    'john',
    'michael',
    'rick',
    'gene',
    'natalie',
    'evan',
    'sakura',
    'kai',
] as const;
let nextLabelIdx = 0;
export function getNextLabel(): string {
    const ret = LABELS_POOL[nextLabelIdx];
    nextLabelIdx = (nextLabelIdx + 1) % LABELS_POOL.length;
    return ret;
}
