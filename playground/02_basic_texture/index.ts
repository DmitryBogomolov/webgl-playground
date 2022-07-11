import {
    parseVertexSchema,
    VertexWriter,
    Runtime,
    Primitive,
    Program,
    Texture, TextureFilterValues,
    Vec2, vec2,
} from 'lib';
import { textureData } from './image';
import { makeControl } from './control';
import { Position, doLayout } from './layout';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

/**
 * Four rectangles.
 *
 * Left rectangles are colored with texture.
 * Top one with *nearest* filter, bottom one with *linear*.
 *
 * Right rectangles are colored with a colored samples from texture.
 * Top one with *nearest* filter, bottom one with *linear*.
 * Texture coordinates are taken from input canvas.
 *
 * Texture is custom 4x4 image.
 * First two rows have colors from black to white.
 * Last two rows have same colors in reverse order.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const vertices: Vec2[] = [
        vec2(-1, -1),
        vec2(+1, -1),
        vec2(+1, +1),
        vec2(-1, +1),
    ];
    const vertexData = new ArrayBuffer(schema.totalSize * vertices.length);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex);
    }
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    const primitive = new Primitive(runtime);

    primitive.setProgram(program);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setIndexCount(indexData.length);

    return primitive;
}

function makeTexture(runtime: Runtime): Texture {
    const texture = new Texture(runtime);
    texture.setParameters({
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
    });
    texture.setImageData(textureData, true);
    return texture;
}

const runtime = new Runtime(container);

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

let texcoord = vec2(0.5, 0.5);
makeControl({ u: texcoord.x, v: texcoord.y }, ({ u, v }) => {
    texcoord = vec2(u, v);
    runtime.requestRender();
});

const layout = doLayout(container);

function drawRect(pos: Position, filter: TextureFilterValues, texcoord: Vec2 | null): void {
    texture.setParameters({
        min_filter: filter,
        mag_filter: filter,
    });
    texture.setUnit(1);
    const program = primitive.program();
    program.setUniform('u_position', pos);
    program.setUniform('u_use_custom', !!texcoord);
    program.setUniform('u_texture', 1);
    if (texcoord) {
        program.setUniform('u_texcoord', texcoord);
    }
    primitive.render();
}

runtime.onRender(() => {
    runtime.clearBuffer();
    drawRect(layout.nearestUV, 'nearest', null);
    drawRect(layout.linearUV, 'linear', null);
    drawRect(layout.nearestCustom, 'nearest', texcoord);
    drawRect(layout.linearCustom, 'linear', texcoord);
});
