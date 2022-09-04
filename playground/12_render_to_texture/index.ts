import {
    Runtime,
    Texture,
    Framebuffer,
    Camera,
    vec3, YUNIT3, norm3, rotate3,
    Mat4, translation4x4, rotation4x4,
    Color, color,
} from 'lib';
import { makeCube, makePlane } from './primitive';

/**
 * Render to texture.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);

const cube = makeCube(runtime);
const plane = makePlane(runtime);

interface ObjectInfo {
    readonly clr: Color;
    readonly model: Mat4;
}
const objects: ReadonlyArray<ObjectInfo> = [
    {
        clr: color(0.8, 0.2, 0.1),
        model: translation4x4(vec3(+1.4, 0, 0)),
    },
    {
        clr: color(0.3, 0.5, 0.9),
        model: translation4x4(vec3(0, 0, +1.2)),
    },
    {
        clr: color(0.8, 0.1, 0.4),
        model: translation4x4(vec3(-1.5, 0, 0)),
    },
    {
        clr: color(0.3, 0.9, 0.2),
        model: translation4x4(vec3(0, 0, -1.6)),
    },
];
const lightDir = norm3(vec3(1, 3, 2));

let cameraPos = vec3(0, 2, 5);
const ROTATION_SPEED = (2 * Math.PI) * 0.1;
const sceneCamera = new Camera();
sceneCamera.setEyePos(cameraPos);

const planeCamera = new Camera();
planeCamera.setEyePos(vec3(0, 0, 2));
const planeModel = rotation4x4(YUNIT3, Math.PI / 6);

const texture = new Texture(runtime);
texture.setParameters({
    wrap_s: 'clamp_to_edge',
    wrap_t: 'clamp_to_edge',
    mag_filter: 'linear',
    min_filter: 'linear',
});
texture.setImageData({ size: [256, 256], data: null }, { format: 'rgba' });
sceneCamera.setViewportSize(texture.size());

const framebuffer = new Framebuffer(runtime);
framebuffer.setupAttachment('color|depth', texture);

runtime.sizeChanged().on(() => {
    planeCamera.setViewportSize(runtime.canvasSize());
});

function renderScene(): void {
    runtime.setFramebuffer(framebuffer);

    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.clearBuffer('color|depth');

    const program = cube.program();
    program.setUniform('u_view_proj', sceneCamera.getTransformMat());
    program.setUniform('u_light_dir', lightDir);
    for (const { clr, model } of objects) {
        program.setUniform('u_color', clr);
        program.setUniform('u_model', model);
        cube.render();
    }
}

function renderPlane(): void {
    runtime.setFramebuffer(null);

    runtime.setClearColor(color(0.4, 0.4, 0.4));
    runtime.clearBuffer('color|depth');

    texture.setUnit(2);
    const program = plane.program();
    program.setUniform('u_view_proj', planeCamera.getTransformMat());
    program.setUniform('u_model', planeModel);
    program.setUniform('u_texture', 2);
    plane.render();
}

runtime.frameRendered().on((delta) => {
    cameraPos = rotate3(cameraPos, YUNIT3, ROTATION_SPEED * delta / 1000);
    sceneCamera.setEyePos(cameraPos);

    renderScene();
    renderPlane();

    runtime.requestFrameRender();
});
