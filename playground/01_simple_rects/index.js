import {
    Context, RenderLoop,
    VertexWriter,
    // FluentVertexWriter as VertexWriter,
    parseSchema, generateDefaultIndexes, logSilenced,
} from 'lib';
import vertexShaderSource from './simple.vert';
import fragmentShaderSource from './simple.frag';

function initData(context, program) {
    const vertices = [
        { position: [-1, +0], color: [1, 0, 0] },
        { position: [-1, -1], color: [1, 0, 0] },
        { position: [+0, -1], color: [1, 0, 0] },

        { position: [+0, -1], color: [1, 1, 0] },
        { position: [+1, -1], color: [1, 1, 0] },
        { position: [+1, +0], color: [1, 1, 0] },

        { position: [+1, +0], color: [0, 1, 0] },
        { position: [+1, +1], color: [0, 1, 0] },
        { position: [+0, +1], color: [0, 1, 0] },

        { position: [+0, +1], color: [0, 1, 1] },
        { position: [-1, +1], color: [0, 1, 1] },
        { position: [-1, +0], color: [0, 1, 1] },
    ];

    const schema = parseSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
        {
            name: 'a_color',
            type: 'ubyte3',
            normalized: true,
        },
    ]);

    const data = new ArrayBuffer(vertices.length * schema.vertexSize);
    const writer = new VertexWriter(data, schema);
    vertices.forEach((vertex, i) => {
        writer.writeField(i, 'a_position', vertex.position);
        writer.writeField(i, 'a_color', vertex.color);
    });

    const vertexBuffer = context.createArrayBuffer();
    context.bindArrayBuffer(vertexBuffer);
    vertexBuffer.setData(data);

    const indexBuffer = context.createElementArrayBuffer();
    context.bindElementArrayBuffer(indexBuffer);
    indexBuffer.setData(new Uint16Array(generateDefaultIndexes(vertices.length)));

    const vao = context.createVertexArrayObject();
    context.bindVertexArrayObject(vao);
    context.bindArrayBuffer(vertexBuffer);
    program.setupVertexAttributes(schema);
    context.bindElementArrayBuffer(indexBuffer);
    context.bindVertexArrayObject(null);

    return {
        vao,
        vertexCount: vertices.length,
    };
}

function init() {
    const container = document.querySelector('.container');
    const context = new Context(container);

    const program = context.createProgram({ vertexShaderSource, fragmentShaderSource });

    const { vao, vertexCount } = initData(context, program);

    return {
        context,
        program,
        vao,
        vertexCount,
    };
}

function render({ context, program, vao, vertexCount }) {
    context.clearColor();
    context.useProgram(program);
    context.bindVertexArrayObject(vao);
    context.drawElements(vertexCount);
    context.bindVertexArrayObject(null);
}

const state = init();
const loop = new RenderLoop(() => render(state));
loop.start();
logSilenced(true);
