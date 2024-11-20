import type { Color, Vec2 } from 'lib';
import type { MainThreadMessage, WorkerMessage } from './messages';
import { Runtime, Primitive, Program, ForegroundChannel, color, vec2, parseVertexSchema, writeVertexData } from 'lib';
import { CONNECTION_ID } from './connection';
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
    const runtime = new Runtime({ element: container });
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
    runWorker(runtime, state);
}

function runWorker(runtime: Runtime, state: State): void {
    const SCALE_UPDATE_INTERVAL = 0.2 * 1000;
    const COLOR_UPDATE_INTERVAL = 1 * 1000;

    const channel = new ForegroundChannel<MainThreadMessage, WorkerMessage>({
        worker: new Worker(),
        connectionId: CONNECTION_ID,
        flushDelay: 5,
        handler: (message) => {
            switch (message.type) {
            case 'worker:set-scale':
                state.scale = message.scale;
                runtime.requestFrameRender();
                break;
            case 'worker:set-color':
                state.clr = message.color;
                runtime.requestFrameRender();
                break;
            }
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
            channel.send({ type: 'main:update-scale', scale: scaleDelta / 1000 });
            scaleDelta = 0;
        }
        if (colorDelta > COLOR_UPDATE_INTERVAL) {
            channel.send({ type: 'main:update-color', color: colorDelta / 1000 });
            colorDelta = 0;
        }
    }, 25);
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
