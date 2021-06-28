import {
    VertexWriter,
    parseVertexSchema,
    WorkerMessenger,
    Color, color2arr,
    logSilenced,
    Runtime,
    Primitive,
    Program,
    UniformValue,
    Vec2, vec2, vec2arr,
} from 'lib';
import { TYPE_SCALE, TYPE_COLOR } from './message-types';
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
        writer.writeAttribute(i, 'a_position', vec2arr(vertex));
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

let clr: UniformValue = [0, 0, 0, 1];
let scale = 0;

function runWorker(runtime: Runtime): void {
    const worker = new WorkerMessenger(WORKER_URL, {
        [TYPE_SCALE](payload) {
            scale = payload as number;
            runtime.requestRender();
        },
        [TYPE_COLOR](payload) {
            clr = color2arr(payload as Color);
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
            worker.post(TYPE_SCALE, scaleDelta / 1000);
            scaleDelta = 0;
        }
        if (colorDelta > COLOR_UPDATE_INTERVAL) {
            worker.post(TYPE_COLOR, colorDelta / 1000);
            colorDelta = 0;
        }
    }, 25);
}



runtime.onRender(() => {
    runtime.clearColorBuffer();
    primitive.program().setUniform('u_scale', scale);
    primitive.program().setUniform('u_color', clr);
    primitive.render();
});
runWorker(runtime);
logSilenced(true);
