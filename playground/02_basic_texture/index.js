import {
    Context,
    color,
    logSilenced,
    parseSchema,
    FluentVertexWriter,
    RenderLoop,
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

function attachHandlers(initial, handleChange) {
    const uInput = document.querySelector('#u-coord-input');
    const vInput = document.querySelector('#v-coord-input');
    const uLabel = document.querySelector('#u-coord-label');
    const vLabel = document.querySelector('#v-coord-label');

    let [uValue, vValue] = initial;

    function updateView() {
        uInput.value = uValue;
        vInput.value = vValue;
        uLabel.innerHTML = uValue;
        vLabel.innerHTML = vValue;
    }

    function notifyChange() {
        handleChange([uValue, vValue]);
    }

    uInput.addEventListener('change', (e) => {
        uValue = Number(e.target.value);
        updateView();
        notifyChange();
    });
    vInput.addEventListener('change', (e) => {
        vValue = Number(e.target.value);
        updateView();
        notifyChange();
    });

    updateView();
}

function generateVertices(schema) {
    const vertices = [
        { position: [-1, -1], texcoord: [0, 0] },
        { position: [+1, -1], texcoord: [1, 0] },
        { position: [+1, +1], texcoord: [1, 1] },
        { position: [-1, +1], texcoord: [0, 1] },
    ];
    const vertexData = new ArrayBuffer(schema.vertexSize * vertices.length);
    const writer = new FluentVertexWriter(vertexData, schema);
    vertices.forEach((vertex, i) => {
        writer.writeField(i, 'a_position', vertex.position);
        writer.writeField(i, 'a_texcoord', vertex.texcoord);
    });
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    return { vertexData, indexData };
}

function generateTextureData() {
    const schema = parseSchema([{ name: 'tex', type: 'ubyte4', normalized: true }]);
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
    const writer = new FluentVertexWriter(buffer, schema);
    pixels.forEach((color, i) => {
        writer.writeField(i, 'tex', [...color, 1]);
    });
    return {
        size: [4, 4],
        data: new Uint8Array(buffer),
    };
}

function init() {
    let texcoord = [0, 0];
    attachHandlers(texcoord, (arg) => {
        texcoord = arg;
    });

    const context = new Context(document.querySelector(PLAYGROUND_ROOT)); // eslint-disable-line no-undef
    
    context.setClearColor(color(0.8, 0.8, 0.8));

    const schema = parseSchema([
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

    const vertexBuffer = context.createArrayBuffer();
    context.bindArrayBuffer(vertexBuffer);
    vertexBuffer.setData(vertexData);

    const indexBuffer = context.createElementArrayBuffer();
    context.bindElementArrayBuffer(indexBuffer);
    indexBuffer.setData(indexData);

    const program = context.createProgram({ vertexShaderSource, fragmentShaderSource });
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

    function drawRect(dir, filter, texcoord) {
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

    const DIR_TL = [-1, +1];
    const DIR_TR = [+1, +1];
    const DIR_BL = [-1, -1];
    const DIR_BR = [+1, -1];

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
