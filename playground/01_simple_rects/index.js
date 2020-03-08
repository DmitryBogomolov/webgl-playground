import {
    Context, RenderLoop,
    VertexWriter,
    // FluentVertexWriter as VertexWriter,
    parseSchema, generateDefaultIndexes, logSilenced,
} from 'lib';
import vertexShaderSource from './simple.vert';
import fragmentShaderSource from './simple.frag';

/**
 * Just four triangles of different colors.
 */

function initData(context, program) {
    const c1 = [1, 0, 0]; // red
    const c2 = [1, 1, 0]; // yellow
    const c3 = [0, 1, 0]; // green
    const c4 = [0, 1, 1]; // cyan
    const vertices = [
        // bottom-left
        { position: [-1, +0], color: c1 },
        { position: [-1, -1], color: c1 },
        { position: [+0, -1], color: c1 },
        // bottom-right
        { position: [+0, -1], color: c2 },
        { position: [+1, -1], color: c2 },
        { position: [+1, +0], color: c2 },
        // top-right
        { position: [+1, +0], color: c3 },
        { position: [+1, +1], color: c3 },
        { position: [+0, +1], color: c3 },
        // top-left
        { position: [+0, +1], color: c4 },
        { position: [-1, +1], color: c4 },
        { position: [-1, +0], color: c4 },
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

    const vertexData = new ArrayBuffer(vertices.length * schema.vertexSize);
    const writer = new VertexWriter(vertexData, schema);
    vertices.forEach((vertex, i) => {
        writer.writeField(i, 'a_position', vertex.position);
        writer.writeField(i, 'a_color', vertex.color);
    });

    const indexData = new Uint16Array(generateDefaultIndexes(vertices.length));

    const vertexBuffer = context.createArrayBuffer();
    context.bindArrayBuffer(vertexBuffer);
    vertexBuffer.setData(vertexData);

    const indexBuffer = context.createElementArrayBuffer();
    context.bindElementArrayBuffer(indexBuffer);
    indexBuffer.setData(indexData);

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
    const container = document.querySelector(PLAYGROUND_ROOT); // eslint-disable-line no-undef
    const context = new Context(container);

    const program = context.createProgram();
    program.setSources(vertexShaderSource, fragmentShaderSource);

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
