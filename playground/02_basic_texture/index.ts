import {
    color,
    logSilenced,
    VertexSchema, parseVertexSchema,
    FluentVertexWriter,
    RenderLoop,
    Runtime,
    Primitive,
    Program,
    Texture, TextureFilterValues,
} from 'lib';
import { textureData } from './image';
import { TexCoord, makeControl } from './control';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

/**
 * Four rectangles.
 *
 * Top rectangles are colored with texture.
 * Left one with *nearest* filter, right one with *linear*.
 *
 * Bottom rectangles are colored with a colored samples from texture.
 * Left one with *nearest* filter, right one with *linear*.
 * Texture coordinates are taken from input controls.
 *
 * Texture is custom 4x4 image.
 * First two rows have colors from black to white.
 * Last two rows have same colors in reverse order.
 */
export type DESCRIPTION = never;

function generateVertices(schema: VertexSchema): { vertexData: ArrayBuffer, indexData: Uint16Array } {
    const vertices = [
        { position: [-1, -1] },
        { position: [+1, -1] },
        { position: [+1, +1] },
        { position: [-1, +1] },
    ];
    const vertexData = new ArrayBuffer(schema.vertexSize * vertices.length);
    const writer = new FluentVertexWriter(vertexData, schema);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex.position);
    }
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    return { vertexData, indexData };
}

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
    const { vertexData, indexData } = generateVertices(schema);

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

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

const runtime = new Runtime(container);
runtime.setClearColor(color(0.8, 0.8, 0.8));

let texcoord: TexCoord = { u: 0.5, v: 0.5 };
makeControl(texcoord, (tc) => {
    texcoord = tc;
});

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

type Position = readonly [number, number, number, number];

const uvWidth = document.querySelector('#uv-col')!.clientWidth;
const customWidth = document.querySelector('#custom-col')!.clientWidth;
const ratio = uvWidth / (uvWidth + customWidth) * 2 - 1;
const X_OFFSET = 4 / container.clientWidth;
const Y_OFFSET = 4 / container.clientHeight;

const LOC_NEAREST_UV: Position = [-1 + X_OFFSET, +Y_OFFSET, ratio - X_OFFSET, +1 - Y_OFFSET];
const LOC_LINEAR_UV: Position = [-1 + X_OFFSET, -1 + Y_OFFSET, ratio - X_OFFSET, -Y_OFFSET];
const LOC_NEAREST_CUSTOM: Position = [ratio + X_OFFSET, +Y_OFFSET, +1 - X_OFFSET, +1 - Y_OFFSET];
const LOC_LINEAR_CUSTOM: Position = [ratio + X_OFFSET, -1 + Y_OFFSET, +1 - X_OFFSET, -Y_OFFSET];

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
    drawRect(LOC_NEAREST_UV, 'nearest', null);
    drawRect(LOC_LINEAR_UV, 'linear', null);
    drawRect(LOC_NEAREST_CUSTOM, 'nearest', texcoord);
    drawRect(LOC_LINEAR_CUSTOM, 'linear', texcoord);
});
loop.start();
logSilenced(true);
