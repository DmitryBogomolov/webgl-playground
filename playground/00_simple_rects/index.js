import {
    Context, RenderLoop, VertexSchema, VertexWriter,
    generateDefaultIndexes,
} from 'lib';
import vertShaderSource from './simple.vert';
import fragShaderSource from './simple.frag';

function initData(context, program) {
    const vertices = [
        { position: [-1,  0], color: [1, 0, 0], },
        { position: [-1, -1], color: [1, 0, 0], },
        { position: [ 0, -1], color: [1, 0, 0], },

        { position: [ 0, -1], color: [1, 1, 0], },
        { position: [ 1, -1], color: [1, 1, 0], },
        { position: [ 1,  0], color: [1, 1, 0], },

        { position: [ 1,  0], color: [0, 1, 0], },
        { position: [ 1,  1], color: [0, 1, 0], },
        { position: [ 0,  1], color: [0, 1, 0], },

        { position: [ 0,  1], color: [0, 1, 1], },
        { position: [-1,  1], color: [0, 1, 1], },
        { position: [-1,  0], color: [0, 1, 1], },
    ];

    const schema = new VertexSchema([
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

    const data = new ArrayBuffer(vertices.length * schema.vertexSize());
    const writer = new VertexWriter(data, schema);
    vertices.forEach((vertex, i) => {
        writer.writeField(i, 'a_position', vertex.position);
        writer.writeField(i, 'a_color', vertex.color);
    });

    const vertexBuffer = context.createArrayBuffer();
    vertexBuffer.bind();
    vertexBuffer.setData(data);

    const indexBuffer = context.createElementArrayBuffer();
    indexBuffer.bind();
    indexBuffer.setData(new Uint16Array(generateDefaultIndexes(vertices.length)));

    const vao = context.createVAO();
    vao.bind();
    vertexBuffer.bind();
    program.setupVertexAttributes(schema);
    indexBuffer.bind();
    vao.unbind();

    return {
        vao,
        vertexCount: vertices.length,
    };
}

function init() {
    const container = document.querySelector('.container');
    const context = new Context(container);

    const program = context.createProgram(vertShaderSource, fragShaderSource);

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
    program.use();
    vao.bind();
    context.drawElements(vertexCount);
    vao.unbind();
}

const state = init();
const loop = new RenderLoop(() => render(state));
loop.start();
