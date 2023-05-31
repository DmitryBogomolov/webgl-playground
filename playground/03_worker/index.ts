import type { Color, Vec2 } from 'lib';
import {
    Runtime,
    Primitive,
    Program,
    VertexWriter,
    parseVertexSchema,
    WorkerMessenger,
    color,
    vec2,
} from 'lib';
import { TYPE_SCALE, TYPE_COLOR } from './message-types';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';
import Worker from 'worker-loader!./worker';

/**
 * Web worker.
 *
 * On each frame message is sent to worker thread. Worker thread from time to time
 * sends message back - with scale or color parameter.
 */
export type DESCRIPTION = never;

main();

interface State {
    clr: Color;
    scale: number;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    const primitive = makePrimitive(runtime);

    const state: State = {
        clr: color(0, 0, 0),
        scale: 0,
    };

    runtime.frameRendered().on(() => {
        runtime.clearBuffer();
        primitive.program().setUniform('u_scale', state.scale);
        primitive.program().setUniform('u_color', state.clr);
        primitive.render();
    });
    runWorker(runtime, state);
}

function runWorker(runtime: Runtime, state: State): void {
    const SCALE_UPDATE_INTERVAL = 0.2 * 1000;
    const COLOR_UPDATE_INTERVAL = 1 * 1000;

    const messenger = new WorkerMessenger(new Worker(), {
        [TYPE_SCALE](payload) {
            state.scale = payload as number;
            runtime.requestFrameRender();
        },
        [TYPE_COLOR](payload) {
            state.clr = payload as Color;
            runtime.requestFrameRender();
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

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);
    const program = new Program(runtime, {
        vertShader,
        fragShader,
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

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexConfig({ indexCount: indexData.length });
    primitive.setProgram(program);

    return primitive;
}
