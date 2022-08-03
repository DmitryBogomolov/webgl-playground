import {
    Runtime,
    color,
    vec3, ZERO3, YUNIT3,
    mat4, perspective4x4, lookAt4x4,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeTexture } from './texture';

/**
 * Projection mapping.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime, () => {
    runtime.requestRender();
});
texture.setUnit(5);
texture.setParameters({
    mag_filter: 'nearest',
    min_filter: 'nearest',
});

const proj = mat4();
const view = lookAt4x4({
    eye: vec3(0, 0, 5),
    center: ZERO3,
    up: YUNIT3,
});

runtime.onSizeChanged(() => {
    const { x, y } = runtime.canvasSize();
    perspective4x4({
        yFov: Math.PI / 4,
        aspect: x / y,
        zNear: 0.01,
        zFar: 100,
    }, proj);
});

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    const program = primitive.program();
    program.setUniform('u_proj', proj);
    program.setUniform('u_view', view);
    primitive.render();
});
