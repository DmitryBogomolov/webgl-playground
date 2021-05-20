import {
    RenderLoop,
    VertexWriter,
    parseVertexSchema,
    WorkerMessenger,
    color, Color, color2array,
    logSilenced,
    Runtime,
    Primitive,
    Program,
} from 'lib';
import {
    TYPE_SCALE,
    TYPE_COLOR,
} from './message-types';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

/**
 * Web worker.
 *
 * On each frame message is sent to worker thread. Worker thread from time to time
 * sends message back - with scale or color parameter.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

const SCALE_UPDATE_INTERVAL = 0.2 * 1000;
const COLOR_UPDATE_INTERVAL = 1 * 1000;

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive(runtime);

    const vertices = [[-1, -1], [+1, -1], [+1, +1], [-1, +1]];

    const vertexData = new ArrayBuffer(4 * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex);
    }
    const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

    primitive.setData(vertexData, indexData);
    primitive.setProgram(program);

    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);

let clr = color(0, 0, 0, 1);
let scale = 0;

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
        'u_color': color2array(clr),
    });
});
loop.start();
logSilenced(true);
