import {
    Runtime,
    mat4, perspective4x4,
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
const FOV = Math.PI / 4;
// Z-distance where [-1, +1] segment exactly matches full canvas height.
// h / 2 = d * tan (FOV / 2)
const DISTANCE = 1 / Math.tan(FOV / 2);

runtime.onSizeChanged(() => {
    const { x, y } = runtime.canvasSize();
    perspective4x4({
        yFov: FOV,
        aspect: x / y,
        zNear: 0.001,
        zFar: 100,
    }, proj);
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
    program.setUniform('u_distance', DISTANCE);

    for (const { offset, size } of RENDER_SCHEMA) {
        program.setUniform('u_offset', offset);
        program.setUniform('u_size', size);
        primitive.render();
    }
});
