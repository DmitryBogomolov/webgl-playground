import type { Runtime, Color, Vec2 } from 'lib';
import type { MainThreadMessage, WorkerMessage } from './messages';
import { Primitive, Program, ForegroundChannel, color, vec2, parseVertexSchema, writeVertexData } from 'lib';
import { setup, disposeAll } from 'playground-utils/setup';
import { CONNECTION_ID } from './connection';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

/**
 * Web worker.
 *
 * On each frame message is sent to worker thread. Worker thread from time to time
 * sends message back - with scale or color parameter.
 */
export type DESCRIPTION = never;

interface State {
    clr: Color;
    scale: number;
}

export function main(): () => void {
    const { runtime } = setup();
    const primitive = makePrimitive(runtime);

    const state: State = {
        clr: color(0, 0, 0),
        scale: 0,
    };

    runtime.frameRequested().on(() => {
        runtime.clearBuffer();
        primitive.program().setUniform('u_scale', state.scale);
        primitive.program().setUniform('u_color', state.clr);
        primitive.render();
    });
    const disposeWorker = runWorker(runtime, state);

    return () => {
        disposeAll([primitive.program(), primitive, runtime, disposeWorker]);
    };
}

function runWorker(runtime: Runtime, state: State): () => void {
    const SCALE_UPDATE_INTERVAL = 0.2 * 1000;
    const COLOR_UPDATE_INTERVAL = 1 * 1000;

    const channel = new ForegroundChannel<MainThreadMessage, WorkerMessage>({
        worker: new Worker(WORKER_URL),
        connectionId: CONNECTION_ID,
        flushDelay: 5,
        handler: (message) => {
            switch (message.type) {
            case 'worker:set-scale':
                state.scale = message.scale;
                break;
            case 'worker:set-color':
                state.clr = message.color;
                break;
            }
            runtime.requestFrameRender();
        },
    });

    let scaleDelta = 0;
    let colorDelta = 0;

    let lastTime = performance.now();
    const interval = setInterval(() => {
        const time = performance.now();
        const delta = time - lastTime;
        lastTime = time;

        scaleDelta += delta;
        colorDelta += delta;
        if (scaleDelta > SCALE_UPDATE_INTERVAL) {
            channel.send({ type: 'main:update-scale', scale: scaleDelta / 1000 });
            scaleDelta = 0;
        }
        if (colorDelta > COLOR_UPDATE_INTERVAL) {
            channel.send({ type: 'main:update-color', color: colorDelta / 1000 });
            colorDelta = 0;
        }
    }, 25);

    return () => {
        channel.dispose();
        clearInterval(interval);
    };
}

function makePrimitive(runtime: Runtime): Primitive {
    const vertexSchema = parseVertexSchema({
        attributes: [{ type: 'float2' }],
    });
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    const primitive = new Primitive({ runtime });

    const vertices: Vec2[] = [
        vec2(-1, -1),
        vec2(+1, -1),
        vec2(+1, +1),
        vec2(-1, +1),
    ];

    const vertexData = writeVertexData(vertices, vertexSchema, (vertex) => ([vertex]));
    const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);

    return primitive;
}
