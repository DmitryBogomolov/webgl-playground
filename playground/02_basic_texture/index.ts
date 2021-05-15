import {
    color,
    logSilenced,
    parseVertexSchema,
    FluentVertexWriter,
    RenderLoop,
    Runtime,
    Primitive,
    Program,
    Texture, TextureFilterValues,
} from 'lib';
import { textureData } from './image';
import { TexCoord, makeControl } from './control';
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

    const vertices = [
        [-1, -1],
        [+1, -1],
        [+1, +1],
        [-1, +1],
    ];
    const vertexData = new ArrayBuffer(schema.vertexSize * vertices.length);
    const writer = new FluentVertexWriter(vertexData, schema);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex);
    }
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    const primitive = new Primitive(runtime);

    primitive.setData(vertexData, indexData);
    primitive.setProgram(program);

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
runtime.setClearColor(color(0.8, 0.8, 0.8));

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

let texcoord: TexCoord = { u: 0.5, v: 0.5 };
makeControl(texcoord, (tc) => {
    texcoord = tc;
});

const layout = doLayout(container);

const loop = new RenderLoop(() => {
    function drawRect(pos: Position, filter: TextureFilterValues, texcoord: TexCoord | null): void {
        texture.setParameters({
            min_filter: filter,
            mag_filter: filter,
        });
        texture.setUnit(1);
        primitive.draw({
            'u_position': pos,
            'u_useCustom': !!texcoord,
            'u_texture': 1,
            ...(texcoord ? { 'u_texcoord': [texcoord.u, texcoord.v] } : null),
        });
    }

    runtime.clearColor();
    drawRect(layout.nearestUV, 'nearest', null);
    drawRect(layout.linearUV, 'linear', null);
    drawRect(layout.nearestCustom, 'nearest', texcoord);
    drawRect(layout.linearCustom, 'linear', texcoord);
});
loop.start();
logSilenced(true);
