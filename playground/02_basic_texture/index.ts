import {
    Context,
    color,
    logSilenced,
    VertexSchema,
    FluentVertexWriter,
    writeVertices,
    RenderLoop,
    RenderFrameCallback,
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
        { position: [-1, -1], texcoord: [0, 0] },
        { position: [+1, -1], texcoord: [1, 0] },
        { position: [+1, +1], texcoord: [1, 1] },
        { position: [-1, +1], texcoord: [0, 1] },
    ];
    const vertexData = new ArrayBuffer(schema.vertexSize * vertices.length);
    writeVertices(new FluentVertexWriter(vertexData, schema), vertices, (vertex) => ({
        a_position: vertex.position,
        a_texcoord: vertex.texcoord,
    }));
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    return { vertexData, indexData };
}

function generateTextureData(): { size: [number, number], data: Uint8Array } {
    const schema = new VertexSchema([{ name: 'tex', type: 'ubyte4', normalized: true }]);
    const pixels = [
        // black, blue, green, cyan,
        [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
        // red, magenta, yellow, white,
        [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
        // white, yellow, magenta, red,
        [1, 1, 1], [1, 1, 0], [1, 0, 1], [1, 0, 0],
        // cyan, green, blue, black,
        [0, 1, 1], [0, 1, 0], [0, 0, 1], [0, 0, 0],
    ];
    const buffer = new ArrayBuffer(pixels.length * schema.vertexSize);
    writeVertices(new FluentVertexWriter(buffer, schema), pixels, (pixel) => ({ tex: [...pixel, 1] }));
    return {
        size: [4, 4],
        data: new Uint8Array(buffer),
    };
}

type TexCoord = Readonly<[number, number]>;
type TexDir = Readonly<[number, number]>;

function init(): RenderFrameCallback {
    let texcoord: TexCoord = [0, 0];
    attachHandlers(texcoord, (arg) => {
        texcoord = arg;
    });

    // eslint-disable-next-line no-undef
    const context = new Context(document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!);

    context.setClearColor(color(0.8, 0.8, 0.8));

    const schema = new VertexSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
        {
            name: 'a_texcoord',
            type: 'float2',
        },
    ]);

    const { vertexData, indexData } = generateVertices(schema);

    const vao = context.createVertexArrayObject();
    context.bindVertexArrayObject(vao);

    const vertexBuffer = context.createVertexBuffer();
    context.bindVertexBuffer(vertexBuffer);
    vertexBuffer.setData(vertexData);

    const indexBuffer = context.createIndexBuffer();
    context.bindIndexBuffer(indexBuffer);
    indexBuffer.setData(indexData);

    const program = context.createProgram();
    program.setSources(vertexShaderSource, fragmentShaderSource);
    program.setupVertexAttributes(schema);

    context.bindVertexArrayObject(null);

    const texData = generateTextureData();
    context.setUnpackFlipY(true);

    const texture = context.createTexture();
    context.activeTexture(0);
    context.bindTexture(texture);
    context.setTextureParameters({
        'wrap-s': 'clamp-to-edge',
        'wrap-t': 'clamp-to-edge',
        'min-filter': 'nearest',
        'mag-filter': 'nearest',
    });
    context.setTextureImage(texData.size[0], texData.size[1], texData.data);

    function drawRect(dir: TexDir, filter: string, texcoord: TexCoord | null): void {
        program.setUniform('u_dir', dir);
        program.setUniform('u_flag', texcoord ? 1 : 0);
        if (texcoord) {
            program.setUniform('u_texcoord', texcoord);
        }

        context.setTextureParameters({
            'min-filter': filter,
            'mag-filter': filter,
        });
        context.drawElements(indexData.length);
    }

    const DIR_TL: TexDir = [-1, +1];
    const DIR_TR: TexDir = [+1, +1];
    const DIR_BL: TexDir = [-1, -1];
    const DIR_BR: TexDir = [+1, -1];

    return () => {
        context.clearColor();
        context.useProgram(program);
        program.setUniform('u_texture', 0);
        context.bindVertexArrayObject(vao);

        drawRect(DIR_TL, 'nearest', null);
        drawRect(DIR_TR, 'linear', null);
        drawRect(DIR_BL, 'nearest', texcoord);
        drawRect(DIR_BR, 'linear', texcoord);

        context.bindVertexArrayObject(null);
    };
}

const render = init();
const loop = new RenderLoop(render);
loop.start();
logSilenced(true);
