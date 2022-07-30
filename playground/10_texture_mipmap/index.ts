import {
    Runtime,
    vec3,
    mat4, perspective4x4, apply4x4, identity4x4, translation4x4,
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
const YFOV = Math.PI / 4;
// Z-distance where [-0.5, +0.5] segment (of unit length) exactly matches full canvas height.
// h / 2 = d * tan (FOV / 2) <=> d = h / 2 / tan(FOV / 2)
const DISTANCE = 1 / 2 / Math.tan(YFOV / 2);

runtime.onSizeChanged(() => {
    identity4x4(proj);
    apply4x4(proj, translation4x4, vec3(0, 0, -DISTANCE));
    const { x, y } = runtime.canvasSize();
    apply4x4(proj, perspective4x4, {
        yFov: YFOV,
        aspect: x / y,
        zNear: 0.001,
        zFar: 100,
    });
});

const RENDER_SCHEMA = [
    { offset: -0.8, size: 0.2 },
    { offset: -0.4, size: 0.4 },
    { offset: 0, size: 0.5 },
    { offset: +0.4, size: 0.7 },
    { offset: +0.8, size: 0.8 },
];

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    const program = primitive.program();

    program.setUniform('u_proj', proj);
    program.setUniform('u_texture', 1);

    for (const { offset, size } of RENDER_SCHEMA) {
        program.setUniform('u_offset', offset);
        program.setUniform('u_size', size);
        primitive.render();
    }
});
