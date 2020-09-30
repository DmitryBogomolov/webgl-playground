import {
    Context, RenderLoop,
    FluentVertexWriter,
    VertexSchema,
    writeVertices,
    color,
    logSilenced,
} from 'lib';
import {
    TYPE_SCALE,
    TYPE_COLOR,
} from './message-types';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

/**
 * TODO
 */

const SCALE_UPDATE_INTERVAL = 0.2 * 1000;
const COLOR_UPDATE_INTERVAL = 1 * 1000;

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

function makeChannel(handler) {
    const worker = new Worker(WORKER_URL);  // eslint-disable-line no-undef
    worker.onmessage = ({ data }) => {
        handler(data.type, data.payload);
    };
    return (type, delta) => {
        worker.postMessage({
            type,
            delta,
        });
    };
}

function init() {
    const container = document.querySelector(PLAYGROUND_ROOT); // eslint-disable-line no-undef
    const context = new Context(container);
    context.setClearColor(color(0.8, 0.8, 0.8));

    const program = context.createProgram();
    program.setSources(vertexShaderSource, fragmentShaderSource);

    const { vao, indexCount } = initData(context, program);

    let clr = color(0, 0, 0, 1);
    let scale = 0;
    const requestUpdate = makeChannel((type, payload) => {
        switch (type) {
            case TYPE_SCALE:
                scale = payload;
                break;
            case TYPE_COLOR:
                clr = payload;
                break;
        }
    });

    let scaleDelta = 0;
    let colorDelta = 0;

    function render(delta) {
        scaleDelta += delta;
        colorDelta += delta;
        if (scaleDelta > SCALE_UPDATE_INTERVAL) {
            requestUpdate(TYPE_SCALE, scaleDelta / 1000);
            scaleDelta = 0;
        }
        if (colorDelta > COLOR_UPDATE_INTERVAL) {
            requestUpdate(TYPE_COLOR, colorDelta / 1000);
            colorDelta = 0;
        }

        context.clearColor();
        context.useProgram(program);
        program.setUniform('u_scale', scale);
        program.setUniform('u_color', [clr.r, clr.g, clr.b, clr.a]);
        context.bindVertexArrayObject(vao);
        context.drawElements(indexCount);
        context.bindVertexArrayObject(null);
    }

    return render;
}

const render = init();
const loop = new RenderLoop(render);
loop.start();
logSilenced(true);
