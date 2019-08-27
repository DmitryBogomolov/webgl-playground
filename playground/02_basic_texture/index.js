import {
    Context,
    color,
    logSilenced,
    parseSchema,
    makeRect,
    FluentVertexWriter,
    RenderLoop,
} from 'lib';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

function createControls(container, handleChange) {
    const controls = document.createElement('div');
    controls.classList.add('controls');
    container.parentElement.insertBefore(controls, container.nextElementSibling);
    let u = 0;
    let v = 0;
    createSlider(controls, u, (value) => {
        u = value;
        handleChange([u, v]);
    });
    createSlider(controls, v, (value) => {
        v = value;
        handleChange([u, v]);
    });
}

function createSlider(container, initialValue, handleChange) {
    const div = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'range';
    input.min = 0;
    input.max = 1;
    input.value = initialValue;
    input.step = 0.05;
    const getValue = () => Number(input.value);
    const label = document.createElement('label');
    const changeLabel = () => {
        const val = getValue();
        label.innerHTML = val.toFixed(2);
    };
    input.onchange = () => {
        changeLabel();
        const val = getValue();
        handleChange(val);
    };
    changeLabel();
    div.appendChild(input);
    div.appendChild(label);
    container.appendChild(div);
}

function generateVertices(schema) {
    const { vertices, indexes } = makeRect((x, y) => ({
        pos: [x, y],
        tex: [(x + 1) / 2, (y + 1) / 2],
    }));
    const vertexData = new ArrayBuffer(schema.vertexSize * vertices.length);
    const writer = new FluentVertexWriter(vertexData, schema);
    vertices.forEach((vertex, i) => {
        writer.writeField(i, 'a_position', vertex.pos);
        writer.writeField(i, 'a_texcoord', vertex.tex);
    });
    const indexData = new Uint16Array(indexes);

    return { vertexData, indexData };
}

function generateTextureData() {
    const schema = parseSchema([{ name: 'tex', type: 'ubyte4', normalized: true }]);
    const pixels = [
        [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
        [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
        [1, 1, 1], [1, 1, 0], [1, 0, 1], [1, 0, 0],
        [0, 1, 1], [0, 1, 0], [0, 0, 1], [0, 0, 0],
    ];
    const buffer = new ArrayBuffer(pixels.length * schema.vertexSize);
    const writer = new FluentVertexWriter(buffer, schema);
    pixels.forEach((color, i) => {
        writer.writeField(i, 'tex', [...color, 1]);
    });
    return {
        dx: 4, dy: 4,
        data: new Uint8Array(buffer),
    };
}

function init() {
    const container = document.querySelector('.container');

    let texcoord = [0, 0];
    createControls(container, (arg) => {
        texcoord = arg;
    });

    const context = new Context(container);
    
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
    context.setTextureImage(texData.dx, texData.dy, texData.data);

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

    return () => {
        context.clearColor();
        context.useProgram(program);
        program.setUniform('u_texture', 0);
        context.bindVertexArrayObject(vao);

        drawRect([-1, +1], 'nearest');
        drawRect([+1, +1], 'linear');
        drawRect([-1, -1], 'nearest', texcoord);
        drawRect([+1, -1], 'linear', texcoord);

        context.bindVertexArrayObject(null);
    };
}

const render = init();
const loop = new RenderLoop(render);
loop.start();
logSilenced(true);
