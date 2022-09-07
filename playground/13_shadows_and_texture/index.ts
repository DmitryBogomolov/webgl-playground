import {
    Runtime,
    Camera,
    vec3, norm3,
} from 'lib';
import { createControls } from 'util/controls';
import { makeColorProgram, makeCube, makeSphere } from './primitive';

/**
 * Shadows and texture.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);

const camera = new Camera();
camera.setEyePos(vec3(0, 3, 5));
const lightDir = norm3(vec3(1, 1, 1));

const cube = makeCube(runtime);
const sphere = makeSphere(runtime);
const program = makeColorProgram(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

function renderShadows(): void {
    runtime.clearBuffer('color|depth');
    cube.render();
    sphere.render();
}

function renderScene(): void {
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_prog', camera.getTransformMat());
    program.setUniform('u_light_dir', lightDir);

    cube.setProgram(program);
    sphere.setProgram(program);

    cube.render();
    sphere.render();
}

runtime.frameRendered().on(() => {
    renderShadows();
    renderScene();
});

createControls(container, [
]);
