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

const pixels = [
    colors.BLACK, colors.BLUE, colors.GREEN, colors.CYAN,
    colors.RED, colors.MAGENTA, colors.YELLOW, colors.WHITE,
    colors.WHITE, colors.YELLOW, colors.MAGENTA, colors.RED,
    colors.CYAN, colors.GREEN, colors.BLUE, colors.BLACK,
];

const TEXTURE_SIZE = 4;

function makeControl(initial: TexCoord, callback: (tc: TexCoord) => void): void {
    const canvas = document.querySelector<HTMLCanvasElement>('#control-canvas')!;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width = canvas.clientWidth * devicePixelRatio;
    const height = canvas.height = canvas.clientHeight * devicePixelRatio;
    const xMin = 40;
    const xMax = width - 40;
    const yMin = 40;
    const yMax = height - 40;
    const dx = (xMax - xMin) / TEXTURE_SIZE;
    const dy = (yMax - yMin) / TEXTURE_SIZE;
    let u = initial[0];
    let v = initial[1];

    function handleDown(e: PointerEvent): void {
        document.addEventListener('pointerup', handleUp);
        document.addEventListener('pointermove', handleMove);
        process(e);
    }

    function handleUp(): void {
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointermove', handleMove);
    }

    function handleMove(e: PointerEvent): void {
        process(e);
    }

    function clamp(val: number, minVal: number, maxVal: number): number {
        if (val < minVal) {
            return minVal;
        }
        if (val > maxVal) {
            return maxVal;
        }
        return val;
    }

    function process(e: PointerEvent): void {
        const eventX = e.clientX - canvas.getBoundingClientRect().left;
        const eventY = e.clientY - canvas.getBoundingClientRect().top;
        u = clamp((eventX - xMin) / (xMax - xMin), 0, 1);
        v = clamp((eventY - yMax) / (yMin - yMax), 0, 1);
        draw();
        callback([u, v]);
    }

    canvas.addEventListener('pointerdown', handleDown);

    function draw(): void {
        ctx.clearRect(0, 0, width, height);
        for (let row = 0; row < TEXTURE_SIZE; ++row) {
            for (let col = 0; col < TEXTURE_SIZE; ++col) {
                const clr = pixels[row * TEXTURE_SIZE + col];
                ctx.fillStyle = color2hex(clr);
                ctx.fillRect(xMin + col * dx, yMin + row * dy, dx, dy);
            }
        }
        const xC = (1 - u) * xMin + u * xMax;
        const yC = (1 - v) * yMax + v * yMin;
        ctx.beginPath();
        ctx.moveTo(xC - 10, yC);
        ctx.lineTo(xC, yC - 10);
        ctx.lineTo(xC + 10, yC);
        ctx.lineTo(xC, yC + 10);
        ctx.closePath();
        ctx.fillStyle = '#7f7f7f';
        ctx.fill();
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(u.toFixed(2), xC, yMin);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(2), xMax, yC);
    }

    draw();
}

type TexCoord = Readonly<[number, number]>;

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

const runtime = new Runtime(container);
runtime.setClearColor(color(0.8, 0.8, 0.8));

let texcoord: TexCoord = [0, 0];
makeControl(texcoord, (tc) => {
    texcoord = tc;
});

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

type Position = readonly [number, number, number, number];

const uvWidth = document.querySelector('#label-uv')!.clientWidth;
const customWidth = document.querySelector('#label-custom')!.clientWidth;
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
