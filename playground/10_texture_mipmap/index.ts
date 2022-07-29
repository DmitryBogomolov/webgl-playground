import {
    Runtime,
    vec3, ZERO3, YUNIT3,
    mat4, perspective4x4, lookAt4x4, mul4x4,
    color,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeTexture } from './texture';

/**
 * Texture mipmap.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime);
makeTexture(runtime);

const proj = mat4();
const view = lookAt4x4({
    eye: vec3(0, 0, 5),
    center: ZERO3,
    up: YUNIT3,
});
const viewProj = mat4();

runtime.onSizeChanged(() => {
    const { x, y } = runtime.canvasSize();
    perspective4x4({
        yFov: Math.PI / 4,
        aspect: x / y,
        zNear: 0.001,
        zFar: 100,
    }, proj);
    mul4x4(proj, view, viewProj);
});

const RENDER_SCHEMA = [
    { offset: -0.8, size: 0.2 },
    { offset: -0.4, size: 0.4 },
    { offset: 0, size: 0.8 },
    { offset: +0.4, size: 1.0 },
    { offset: +0.8, size: 1.5 },
];

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    const program = primitive.program();

    program.setUniform('u_model_view_proj', viewProj);
    program.setUniform('u_texture', 1);

    for (const { offset, size } of RENDER_SCHEMA) {
        program.setUniform('u_offset', offset);
        program.setUniform('u_size', size);
        primitive.render();
    }
});
