import {
    Context, RenderLoop,
    FluentVertexWriter,
    VertexSchema,
    writeVertices,
    WorkerMessenger,
    color,
    Color,
    logSilenced,
    RenderFrameCallback,
    Program,
    VertexArrayObject,
} from 'lib';
import {
    TYPE_SCALE,
    TYPE_COLOR,
} from './message-types';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

/**
 * Web worker.
 *
 * On each frame message is sent to worker thread. Worker thread from time to time
 * sends message back - with scale or color parameter.
 */

const SCALE_UPDATE_INTERVAL = 0.2 * 1000;
const COLOR_UPDATE_INTERVAL = 1 * 1000;

function initData(context: Context, program: Program): { vao: VertexArrayObject, indexCount: number } {
    const schema = new VertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);

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
    program.setupVertexAttributes(schema);
    context.bindIndexBuffer(indexBuffer);
    context.bindVertexArrayObject(null);

    return {
        vao,
        indexCount: indexData.length,
    };
}

function init(): RenderFrameCallback {
    // eslint-disable-next-line no-undef
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const context = new Context(container);
    context.setClearColor(color(0.8, 0.8, 0.8));

    const program = context.createProgram();
    program.setSources(vertexShaderSource, fragmentShaderSource);

    const { vao, indexCount } = initData(context, program);

    let clr = color(0, 0, 0, 1);
    let scale = 0;

    // eslint-disable-next-line no-undef
    const worker = new WorkerMessenger(WORKER_URL, {
        [TYPE_SCALE](payload) {
            scale = payload as number;
        },
        [TYPE_COLOR](payload) {
            clr = payload as Color;
        },
    });

    let scaleDelta = 0;
    let colorDelta = 0;

    function render(delta: number): void {
        scaleDelta += delta;
        colorDelta += delta;
        if (scaleDelta > SCALE_UPDATE_INTERVAL) {
            worker.post(TYPE_SCALE, scaleDelta / 1000);
            scaleDelta = 0;
        }
        if (colorDelta > COLOR_UPDATE_INTERVAL) {
            worker.post(TYPE_COLOR, colorDelta / 1000);
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
