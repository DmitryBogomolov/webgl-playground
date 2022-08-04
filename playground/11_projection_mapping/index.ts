import {
    Runtime,
    color,
    vec3, norm3, ZERO3, YUNIT3,
    mat4, perspective4x4, lookAt4x4, apply4x4, scaling4x4, orthographic4x4,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeTexture } from './texture';

/**
 * Projection mapping.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const lightDirection = norm3(vec3(-0.1, -0.3, -1));

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

const textureMat = lookAt4x4({
    eye: vec3(0, 0, 4),
    center: ZERO3,
    up: YUNIT3,
});
const k = 1;
const dk = 0.4;
apply4x4(textureMat, orthographic4x4, {
    left: -dk * k,
    right: +dk * k,
    bottom: -dk,
    top: +dk,
    zNear: 0.01,
    zFar: 100,
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
    program.setUniform('u_texture_mat', textureMat);
    program.setUniform('u_light_direction', lightDirection);
    primitive.render();
});
