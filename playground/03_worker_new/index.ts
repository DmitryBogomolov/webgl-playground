import {
    RenderLoop,
    FluentVertexWriter,
    VertexSchema,
    writeVertices,
    WorkerMessenger,
    color,
    Color,
    logSilenced,
    Runtime_,
    Primitive_,
    Program_,
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

function makePrimitive(runtime: Runtime_): Primitive_ {
    const schema = new VertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);
    const program = new Program_(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive_(runtime);

    const vertexData = new ArrayBuffer(4 * schema.vertexSize);
    writeVertices(new FluentVertexWriter(vertexData, schema), [[-1, -1], [+1, -1], [+1, +1], [-1, +1]], (vertex) => ({
        a_position: vertex,
    }));
    const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

    primitive.setData(vertexData, indexData);
    primitive.setProgram(program);

    return primitive;
}

// eslint-disable-next-line no-undef
const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime_(container);
runtime.setClearColor(color(0.8, 0.8, 0.8));
const primitive = makePrimitive(runtime);

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

const loop = new RenderLoop((delta) => {
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

    runtime.clearColor();
    primitive.draw({
        'u_scale': scale,
        'u_color': [clr.r, clr.g, clr.b, clr.a],
    });
});
loop.start();
logSilenced(true);
