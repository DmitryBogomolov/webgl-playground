import {
    Context,
    logSilenced,
    parseSchema,
    makeRect,
    FluentVertexWriter,
    RenderLoop,
} from 'lib';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

function init() {
    const container = document.querySelector('.container');
    const context = new Context(container);

    const schema = parseSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
    ]);
    const { vertices, indexes } = makeRect();
    const vertexData = new ArrayBuffer(schema.vertexSize * vertices.length);
    const writer = new FluentVertexWriter(vertexData, schema);
    vertices.forEach((vertex, i) => {
        writer.writeField(i, 'a_position', vertex);
    });
    const indexData = new Uint16Array(indexes);

    const vao = context.createVertexArrayObject();
    vao.bind();

    const vertexBuffer = context.createArrayBuffer();
    vertexBuffer.bind();
    vertexBuffer.setData(vertexData);

    const indexBuffer = context.createElementArrayBuffer();
    indexBuffer.bind();
    indexBuffer.setData(indexData);

    const program = context.createProgram({ vertexShaderSource, fragmentShaderSource });
    program.setupVertexAttributes(schema);
    
    context.bindVertexArrayObject(null);

    return () => {
        context.clearColor();
        program.use();
        vao.bind();
        context.drawElements(indexes.length);
        context.bindVertexArrayObject(null);
    };
}

const render = init();
const loop = new RenderLoop(render);
loop.start();
logSilenced(true);
