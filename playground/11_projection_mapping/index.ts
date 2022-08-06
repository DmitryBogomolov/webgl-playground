import {
    Runtime,
    color,
    vec3, ZERO3, YUNIT3,
    mat4, perspective4x4, lookAt4x4, apply4x4, orthographic4x4,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeFillTexture, makeMappingTexture } from './texture';

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
const fillTexture = makeFillTexture(runtime);
const mappingTexture = makeMappingTexture(runtime, () => {
    runtime.requestRender();
});

const proj = mat4();
const view = lookAt4x4({
    eye: vec3(0, 0, 5),
    center: ZERO3,
    up: YUNIT3,
});

const planarMat = lookAt4x4({
    eye: vec3(0, 0, 4),
    center: ZERO3,
    up: YUNIT3,
});
const k = 1;
const dk = 0.5;
apply4x4(planarMat, orthographic4x4, {
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
    fillTexture.setUnit(4);
    mappingTexture.setUnit(5);
    program.setUniform('u_proj', proj);
    program.setUniform('u_view', view);
    program.setUniform('u_texture', 4);
    program.setUniform('u_planar_texture', 5);
    program.setUniform('u_planar_mat', planarMat);
    primitive.render();
});
