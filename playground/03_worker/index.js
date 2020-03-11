import {
    Context, RenderLoop,
    FluentVertexWriter,
    VertexSchema,
    writeVertices,
    logSilenced,
} from 'lib';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

/**
 * TODO
 */


function initData(context, program) {
    const schema = new VertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);

    program.setupVertexAttributes(schema);

    const vertexData = new ArrayBuffer(4 * schema.vertexSize);
    writeVertices(new FluentVertexWriter(vertexData, schema), [[-1, -1], [+1, -1], [+1, +1], [-1, +1]], (vertex) => ({
        a_position: vertex,
    }));
    const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

    const vertexBuffer = context.createVertexBuffer();
    context.bindVertexBuffer(vertexBuffer);
    vertexBuffer.setData(vertexData);

    const indexBuffer = context.createIndexBuffer();
    context.bindIndexBuffer(indexBuffer);
    indexBuffer.setData(indexData);

    const vao = context.createVertexArrayObject();
    context.bindVertexArrayObject(vao);
    context.bindVertexBuffer(vertexBuffer);
    context.bindIndexBuffer(indexBuffer);
    program.setupVertexAttributes(schema);
    context.bindVertexArrayObject(null);

    return {
        vao,
        indexCount: indexData.length,
    };
}

function init() {
    const container = document.querySelector(PLAYGROUND_ROOT); // eslint-disable-line no-undef
    const context = new Context(container);

    const program = context.createProgram();
    program.setSources(vertexShaderSource, fragmentShaderSource);

    const { vao, indexCount } = initData(context, program);

    return {
        context,
        program,
        vao,
        indexCount,
    };
}

function render({ context, program, vao, indexCount }) {
    context.clearColor();
    context.useProgram(program);
    context.bindVertexArrayObject(vao);
    context.drawElements(indexCount);
    context.bindVertexArrayObject(null);
}

const state = init();
const loop = new RenderLoop(() => render(state));
loop.start();
logSilenced(true);
