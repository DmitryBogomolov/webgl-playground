import {
    Runtime,
    Texture,
    Framebuffer,
    Camera,
    vec3, YUNIT3, norm3, rotate3,
    Mat4, mat4, identity4x4, translation4x4, apply4x4, xrotation4x4, yrotation4x4,
    Color, color,
    deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeCube, makePlane } from './primitive';

/**
 * Render to texture.
 *
 * Show rendering to texture with additional depth renderbuffer.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);

const textureClearColor = color(0.7, 0.7, 0.7);
const targetClearColor = color(0.4, 0.4, 0.4);

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

const animationFlag = observable(true);
const xRotation = observable(0);
const yRotation = observable(30);

let textureCameraPos = vec3(0, 2, 5);
const CAMERA_ROTATION_SPEED = (2 * Math.PI) * 0.1;
const textureCamera = new Camera();
textureCamera.setEyePos(textureCameraPos);

const targetCamera = new Camera();
targetCamera.setEyePos(vec3(0, 0, 2));

const _targetModel = mat4();
const targetModel = computed(([xRotation, yRotation]) => {
    const mat = _targetModel;
    identity4x4(mat);
    apply4x4(mat, xrotation4x4, deg2rad(xRotation));
    apply4x4(mat, yrotation4x4, deg2rad(yRotation));
    return mat;
}, [xRotation, yRotation]);

const texture = new Texture(runtime);
texture.setParameters({
    wrap_s: 'clamp_to_edge',
    wrap_t: 'clamp_to_edge',
    mag_filter: 'linear',
    min_filter: 'linear',
});
texture.setImageData({ size: [256, 256], data: null }, { format: 'rgba' });
textureCamera.setViewportSize(texture.size());

const framebuffer = new Framebuffer(runtime);
framebuffer.setupAttachment('color|depth', texture);

runtime.sizeChanged().on(() => {
    targetCamera.setViewportSize(runtime.canvasSize());
});

function renderTexture(): void {
    runtime.setFramebuffer(framebuffer);

    runtime.setClearColor(textureClearColor);
    runtime.clearBuffer('color|depth');

    const program = cube.program();
    program.setUniform('u_view_proj', textureCamera.getTransformMat());
    program.setUniform('u_light_dir', lightDir);
    for (const { clr, model } of objects) {
        program.setUniform('u_color', clr);
        program.setUniform('u_model', model);
        cube.render();
    }
}

function renderTarget(): void {
    runtime.setFramebuffer(null);

    runtime.setClearColor(targetClearColor);
    runtime.clearBuffer('color|depth');

    texture.setUnit(2);
    const program = plane.program();
    program.setUniform('u_view_proj', targetCamera.getTransformMat());
    program.setUniform('u_model', targetModel());
    program.setUniform('u_texture', 2);
    plane.render();
}

[animationFlag, targetModel]
    .forEach((item) => item.on(() => runtime.requestFrameRender()));

runtime.frameRendered().on((delta) => {
    if (animationFlag()) {
        textureCameraPos = rotate3(textureCameraPos, YUNIT3, CAMERA_ROTATION_SPEED * delta / 1000);
        textureCamera.setEyePos(textureCameraPos);
    }

    renderTexture();
    renderTarget();

    if (animationFlag()) {
        runtime.requestFrameRender();
    }
});

createControls(container, [
    { label: 'animation', checked: animationFlag },
    { label: 'x rotation', value: xRotation, min: -45, max: +45 },
    { label: 'y rotation', value: yRotation, min: -45, max: +45 },
]);
