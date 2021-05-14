import {
    color, colors,
    logSilenced,
    VertexSchema, parseVertexSchema,
    FluentVertexWriter,
    RenderLoop,
    Runtime,
    Primitive,
    Program,
    Texture, TextureFilterValues, TextureData, color2hex,
} from 'lib';
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

interface Control {
    draw(): void;
}

const pixels = [
    colors.BLACK, colors.BLUE, colors.GREEN, colors.CYAN,
    colors.RED, colors.MAGENTA, colors.YELLOW, colors.WHITE,
    colors.WHITE, colors.YELLOW, colors.MAGENTA, colors.RED,
    colors.CYAN, colors.GREEN, colors.BLUE, colors.BLACK,
];

const TEXTURE_SIZE = 4;

function makeControl(): Control {
    const canvas = document.querySelector<HTMLCanvasElement>('#control-canvas')!;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;
    const xMin = 0;
    const xMax = width;
    const yMin = 0;
    const yMax = height;
    const dw = (xMax - xMin) / TEXTURE_SIZE;
    const dh = (yMax - yMin) / TEXTURE_SIZE;

    return {
        draw() {
            for (let row = 0; row < TEXTURE_SIZE; ++row) {
                for (let col = 0; col < TEXTURE_SIZE; ++col) {
                    const clr = pixels[row * TEXTURE_SIZE + col];
                    ctx.fillStyle = color2hex(clr);
                    ctx.fillRect(col * dw, row * dh, dw, dh);
                }
            }
        }
    };
}

type TexCoord = Readonly<[number, number]>;

function attachHandlers(initial: TexCoord, handleChange: (val: TexCoord) => void): void {
    const uInput = document.querySelector<HTMLInputElement>('#u-coord-input')!;
    const vInput = document.querySelector<HTMLInputElement>('#v-coord-input')!;
    const uLabel = document.querySelector<HTMLSpanElement>('#u-coord-label')!;
    const vLabel = document.querySelector<HTMLSpanElement>('#v-coord-label')!;

    let [uValue, vValue] = initial;

    function updateView(): void {
        uInput.value = String(uValue);
        vInput.value = String(vValue);
        uLabel.innerHTML = String(uValue);
        vLabel.innerHTML = String(vValue);
    }

    function notifyChange(): void {
        handleChange([uValue, vValue]);
    }

    uInput.addEventListener('change', () => {
        uValue = Number(uInput.value);
        updateView();
        notifyChange();
    });
    vInput.addEventListener('change', () => {
        vValue = Number(vInput.value);
        updateView();
        notifyChange();
    });

    updateView();
}

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

function generateTextureData(): TextureData {
    const data = new Uint8ClampedArray(16 * 4);
    let i = 0;
    for (const { r, g, b, a } of pixels) {
        data[i++] = r * 0xFF;
        data[i++] = g * 0xFF;
        data[i++] = b * 0xFF;
        data[i++] = a * 0xFF;
    }
    return {
        size: [TEXTURE_SIZE, TEXTURE_SIZE],
        data,
    };
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
    const data = generateTextureData();
    const texture = new Texture(runtime);
    texture.setParameters({
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
    });
    texture.setImageData(data, true);
    return texture;
}

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
document.querySelector('#for-background')!.appendChild(container);

const runtime = new Runtime(container);
runtime.setClearColor(color(0.8, 0.8, 0.8));

let texcoord: TexCoord = [0, 0];
// attachHandlers(texcoord, (arg) => {
//     texcoord = arg;
// });

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

type Position = readonly [number, number, number, number];

const uvWidth = document.querySelector('#label-uv')!.clientWidth;
const customWidth = document.querySelector('#label-custom')!.clientWidth;
const ratio = uvWidth / (uvWidth + customWidth) * 2 - 1;
// TODO: Take size from "Runtime" and calculate for 2 pixels.
const OFFSET = 0.1;

const LOC_NEAREST_UV: Position = [-1 + OFFSET, +OFFSET, ratio - OFFSET, +1 - OFFSET];
const LOC_LINEAR_UV: Position = [-1 + OFFSET, -1 + OFFSET, ratio - OFFSET, -OFFSET];
const LOC_NEAREST_CUSTOM: Position = [ratio + OFFSET, +OFFSET, +1 - OFFSET, +1 -OFFSET];
const LOC_LINEAR_CUSTOM: Position = [ratio + OFFSET, -1 + OFFSET, +1 - OFFSET, -OFFSET];

const control = makeControl();
control.draw();

const loop = new RenderLoop(() => {
    function drawRect(pos: Position, filter: TextureFilterValues, texcoord: TexCoord | null): void {
        texture.setParameters({
            min_filter: filter,
            mag_filter: filter,
        });
        texture.setUnit(1);
        primitive.draw({
            'u_position': pos,
            'u_flag': texcoord ? 1 : 0,
            'u_texture': 1,
            ...(texcoord ? { 'u_texcoord': texcoord } : null),
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
