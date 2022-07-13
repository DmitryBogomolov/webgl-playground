import {
    VertexWriter,
    parseVertexSchema,
    WorkerMessenger,
    Color, color,
    logSilenced,
    Runtime,
    Primitive,
    Program,
    Vec2, vec2,
} from 'lib';
import { TYPE_SCALE, TYPE_COLOR } from './message-types';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';
import Worker from 'worker-loader!./worker';

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

    const vertices: Vec2[] = [
        vec2(-1, -1),
        vec2(+1, -1),
        vec2(+1, +1),
        vec2(-1, +1),
    ];

    const vertexData = new ArrayBuffer(4 * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex);
    }
    const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

    primitive.setProgram(program);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setIndexCount(indexData.length);

    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);

let clr = color(0, 0, 0);
let scale = 0;

function runWorker(runtime: Runtime): void {
    const messenger = new WorkerMessenger(new Worker(), {
        [TYPE_SCALE](payload) {
            scale = payload as number;
            runtime.requestRender();
        },
        [TYPE_COLOR](payload) {
            clr = payload as Color;
            runtime.requestRender();
        },
    });

    let scaleDelta = 0;
    let colorDelta = 0;

    let lastTime = performance.now();
    setInterval(() => {
        const time = performance.now();
        const delta = time - lastTime;
        lastTime = time;

        scaleDelta += delta;
        colorDelta += delta;
        if (scaleDelta > SCALE_UPDATE_INTERVAL) {
            messenger.post(TYPE_SCALE, scaleDelta / 1000);
            scaleDelta = 0;
        }
        if (colorDelta > COLOR_UPDATE_INTERVAL) {
            messenger.post(TYPE_COLOR, colorDelta / 1000);
            colorDelta = 0;
        }
    }, 25);
}



runtime.onRender(() => {
    runtime.clearBuffer();
    primitive.program().setUniform('u_scale', scale);
    primitive.program().setUniform('u_color', clr);
    primitive.render();
});
runWorker(runtime);
logSilenced(true);
