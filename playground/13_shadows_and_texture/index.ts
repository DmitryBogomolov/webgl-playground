import {
    Runtime,
    Primitive,
    Framebuffer,
    Camera,
    Vec3, vec3,
    Mat4, translation4x4, inversetranspose4x4,
    Color, colors, color, Program,
} from 'lib';
import { createControls } from 'util/controls';
import { makeProgram, makeDepthProgram, makeCube, makeSphere } from './primitive';

/**
 * Shadows and texture.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container, { extensions: ['depth_texture'] });
runtime.setDepthTest(true);

const backgroundColor = color(0.7, 0.7, 0.7);
const depthDataBackgroundColor = color(1, 1, 1);

const depthCamera = new Camera();
const camera = new Camera();
depthCamera.setEyePos(vec3(-5, 0, 2));
// Z range should be quite small. Z precision goes down with distance from camera
// and total Z range further affects it. So Z range should be as small as possible.
depthCamera.setZNear(2);
depthCamera.setZFar(10);
camera.setEyePos(vec3(-2, 3, 5));

const framebuffer = new Framebuffer(runtime);
framebuffer.setup('color|depth', { x: 512, y: 512 }, true);
depthCamera.setViewportSize(framebuffer.size());

function makeObject(primitive: Primitive, offset: Vec3, clr: Color): {
    readonly primitive: Primitive;
    readonly model: Mat4;
    readonly modelInvtrs: Mat4;
    readonly color: Color;
} {
    const model = translation4x4(offset);
    const modelInvtrs = inversetranspose4x4(model);
    return {
        primitive,
        model,
        modelInvtrs,
        color: clr,
    };
}
const objects = [
    makeObject(
        makeCube(runtime, 2),
        vec3(+2, 0, 0),
        colors.CYAN,
    ),
    makeObject(
        makeSphere(runtime, 1.5),
        vec3(-1, 0, 0),
        colors.MAGENTA,
    ),
] as const;

const program = makeProgram(runtime);
const depthProgram = makeDepthProgram(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

function renderDepthData(program: Program, camera: Camera): void {
    runtime.setFramebuffer(framebuffer);
    runtime.setClearColor(depthDataBackgroundColor);
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_proj', camera.getTransformMat());

    for (const obj of objects) {
        program.setUniform('u_model', obj.model);
        obj.primitive.setProgram(program);
        obj.primitive.render();
    }
}

function renderScene(program: Program, camera: Camera, depthCamera: Camera): void {
    runtime.setFramebuffer(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');
    // Color buffer (instead of depth buffer) could be used here.
    // But depth texture is used to demonstrate depth texture usage.
    runtime.setTextureUnit(4, framebuffer.depthTexture());
    program.setUniform('u_view_proj', camera.getTransformMat());
    program.setUniform('u_light_pos', depthCamera.getEyePos());
    program.setUniform('u_depth_view_proj', depthCamera.getTransformMat());
    program.setUniform('u_depth_texture', 4);

    for (const obj of objects) {
        program.setUniform('u_model', obj.model);
        program.setUniform('u_model_invtrs', obj.modelInvtrs);
        program.setUniform('u_color', obj.color);
        obj.primitive.setProgram(program);
        obj.primitive.render();
    }
}

runtime.frameRendered().on(() => {
    renderDepthData(depthProgram, depthCamera);
    renderScene(program, camera, depthCamera);
});

createControls(container, [
]);
