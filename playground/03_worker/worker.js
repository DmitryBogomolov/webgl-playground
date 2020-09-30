import {
    color,
} from 'lib';
import {
    TYPE_SCALE,
    TYPE_COLOR,
} from './message-types';

const SCALE_CHANGE_SPEED = 0.1;
const COLOR_CHANGE_SPEED = 4;

// `currentScale` changes in 0 -> 1 -> 0 ...
// 0.3 -> 0.3, 1.2 -> 0.8
let currentScale = 0;

function updateScale(delta) {
    currentScale = (currentScale + delta * SCALE_CHANGE_SPEED) % 2;
}

function buildScale(value) {
    return value >= 1 ? 2 - value : value;
}

// `currentColor` changes in [0, 3) interval.
// 0.3 -> (0.3, 0, 0), 1.2 -> (0, 0.2, 0), 2.4 -> (0, 0, 0.4)
let currentColor = 0;

function updateColor(delta) {
    currentColor = (currentColor + delta * COLOR_CHANGE_SPEED) % 3;
}

function buildColor(value) {
    const idx = Math.floor(value);
    const fac = value - idx;
    const ret = [0, 0, 0];
    ret[idx] = fac;
    return color(...ret);
}

onmessage = (e) => {
    const delta = e.data.delta;
    switch (e.data.type) {
        case TYPE_SCALE:
            updateScale(delta);
            postMessage({
                type: TYPE_SCALE,
                payload: buildScale(currentScale),
            });
            break;
        case TYPE_COLOR:
            updateColor(delta);
            postMessage({
                type: TYPE_COLOR,
                payload: buildColor(currentColor),
            });
            break;
    }
};
