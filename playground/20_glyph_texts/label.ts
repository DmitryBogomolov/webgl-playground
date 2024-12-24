import type { Runtime, Vec2 } from 'lib';
import type { GlyphAtlas } from './glyph';
import { Primitive, Program, vec2, parseVertexSchema } from 'lib';
import vertShader from './shaders/label.vert';
import fragShader from './shaders/label.frag';

// Generates quads for each character in string.
// All quads are aligned horizontally and cover [-1,+1]*[-1,+1] range.
// Calculates texture coordinates for each quad based on glyph location in atlas.
// Also calculates total pixel size of generated quad (required in shader to calculate actual position).
export function makeStringPrimitive(runtime: Runtime, program: Program, atlas: GlyphAtlas, text: string): {
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
        const { size, location } = atlas.glyphs.get(text.charCodeAt(i))!;
        const x1 = xOffset;
        const x2 = xOffset + 2 * size.x / fullWidth;
        const y1 = -1;
        const y2 = +1;
        const u1 = location.x / atlasWidth;
        const u2 = (location.x + size.x) / atlasWidth;
        const v1 = 1 - (location.y + size.y) / atlasHeight;
        const v2 = 1 - location.y / atlasHeight;
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

    const vertexData = new Float32Array(vertices);
    const indexData = new Uint16Array(indices);
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float2' },
            { type: 'float2' },
        ],
    });

    const primitive = new Primitive({ runtime });
    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);

    return { primitive, size: vec2(fullWidth, fullHeight) };
}

// Just an arbitrary set of words.
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

export function makeStringProgram(runtime: Runtime): Program {
    return new Program({
        runtime,
        vertShader,
        fragShader,
    });
}
