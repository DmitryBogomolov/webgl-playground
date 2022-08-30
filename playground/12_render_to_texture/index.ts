import {
    Runtime,
    Camera,
    vec3, norm3,
    identity4x4,
    color,
} from 'lib';
import { makeCube } from './primitive';

/**
 * Render to texture.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);

const cube = makeCube(runtime);
const model = identity4x4();
const clr = color(0.8, 0.2, 0.1);

const lightDir = norm3(vec3(1, 3, 2));

const camera = new Camera();
camera.setEyePos(vec3(0, 2, 5));

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

runtime.frameRendered().on(() => {
    runtime.clearBuffer('color|depth');

    cube.program().setUniform('u_view_proj', camera.getTransformMat());
    cube.program().setUniform('u_model', model);
    cube.program().setUniform('u_light_dir', lightDir);
    cube.program().setUniform('u_color', clr);

    cube.render();
});
