import type { Color } from 'lib';
import type { MainThreadMessage, WorkerMessage } from './messages';
import {
    color,
    // setWorkerMessageHandler,
    BackgroundChannel,
    // postWorkerMessage,
} from 'lib';
import { CONNECTION_ID } from './connection';
// import {
//     TYPE_SCALE,
//     TYPE_COLOR,
// } from './message-types';

const SCALE_CHANGE_SPEED = 0.1;
const COLOR_CHANGE_SPEED = 4;

// `currentScale` changes in 0 -> 1 -> 0 ...
// 0.3 -> 0.3, 1.2 -> 0.8
let currentScale = 0;

function updateScale(delta: number): void {
    currentScale = (currentScale + delta * SCALE_CHANGE_SPEED) % 2;
}

function buildScale(value: number): number {
    return value >= 1 ? 2 - value : value;
}

// `currentColor` changes in [0, 3) interval.
// 0.3 -> (0.3, 0, 0), 1.2 -> (0, 0.2, 0), 2.4 -> (0, 0, 0.4)
let currentColor = 0;

function updateColor(delta: number): void {
    currentColor = (currentColor + delta * COLOR_CHANGE_SPEED) % 3;
}

function buildColor(value: number): Color {
    const idx = Math.floor(value);
    const fac = value - idx;
    const ret = [0, 0, 0];
    ret[idx] = fac;
    return color(ret[0], ret[1], ret[2]);
}

// setWorkerMessageHandler({
//     [TYPE_SCALE](payload) {
//         updateScale(payload as number);
//         postWorkerMessage(TYPE_SCALE, buildScale(currentScale));
//     },
//     [TYPE_COLOR](payload) {
//         updateColor(payload as number);
//         postWorkerMessage(TYPE_COLOR, buildColor(currentColor));
//     },
// });

const channel = new BackgroundChannel<WorkerMessage, MainThreadMessage>({
    connectionId: CONNECTION_ID,
    handler: (message) => {
        switch (message.type) {
            case 'update-scale': {
                updateScale(message.scale);
                channel.send({ type: 'set-scale', scale: buildScale(currentScale) }, []);
                break;
            }
            case 'update-color': {
                updateColor(message.color);
                channel.send({ type: 'set-color', color: buildColor(currentColor) }, []);
                break;
            }
        }
    },
});
