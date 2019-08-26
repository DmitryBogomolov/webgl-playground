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

    const texture = context.createTexture();
    context.activeTexture(0);
    context.bindTexture(texture);

    const textureData = new ArrayBuffer(16 * 4);
    const textureWriter = new FluentVertexWriter(textureData, parseSchema([
        { name: 'tex', type: 'ubyte4', normalized: true },
    ]));
    [
        [0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
        [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1],
        [1, 1, 1], [1, 1, 0], [1, 0, 1], [1, 0, 0],
        [0, 1, 1], [0, 1, 0], [0, 0, 1], [0, 0, 0],
    ].forEach((color, i) => {
        textureWriter.writeField(i, 'tex', color);
    });
    context.setTextureImage(4, 4, new Uint8Array(textureData));

    return () => {
        context.clearColor();
        context.useProgram(program);
        context.bindVertexArrayObject(vao);
        context.drawElements(indexes.length);
        context.bindVertexArrayObject(null);
    };
}

const render = init();
const loop = new RenderLoop(render);
loop.start();
logSilenced(true);
