import {
    Runtime,
    Primitive,
    Framebuffer,
    Camera,
    vec3,
    Mat4, mat4, translation4x4, inversetranspose4x4,
    Color, colors, color,
} from 'lib';
import { createControls } from 'util/controls';
import { makeColorProgram, makeShadowProgram, makeCube, makeSphere } from './primitive';

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
const shadowBackgroundColor = color(1, 1, 1);

const shadowCamera = new Camera();
const camera = new Camera();
shadowCamera.setEyePos(vec3(-6, 0, 0));
camera.setEyePos(vec3(0, 3, 5));

const framebuffer = new Framebuffer(runtime);
framebuffer.setup('color|depth', { x: 512, y: 512 }, true);
shadowCamera.setViewportSize(framebuffer.size());

interface ObjectInfo {
    readonly primitive: Primitive;
    readonly model: Mat4;
    readonly modelInvtrs: Mat4;
    readonly color: Color;
}

const objects: ReadonlyArray<ObjectInfo> = [
    {
        primitive: makeCube(runtime, 2),
        model: translation4x4(vec3(+2, 0, 0)),
        modelInvtrs: mat4(),
        color: colors.CYAN,
    },
    {
        primitive: makeSphere(runtime, 1.5),
        model: translation4x4(vec3(-1, 0, 0)),
        modelInvtrs: mat4(),
        color: colors.MAGENTA,
    },
];
objects.forEach((obj) => {
    inversetranspose4x4(obj.model, obj.modelInvtrs);
});

const program = makeColorProgram(runtime);
const shadowProgram = makeShadowProgram(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

function renderShadows(): void {
    runtime.setFramebuffer(framebuffer);
    runtime.setClearColor(shadowBackgroundColor);
    runtime.clearBuffer('color|depth');
    const prog = shadowProgram;
    prog.setUniform('u_view_proj', shadowCamera.getTransformMat());

    for (const obj of objects) {
        prog.setUniform('u_model', obj.model);
        obj.primitive.setProgram(prog);
        obj.primitive.render();
    }
}

function renderScene(): void {
    runtime.setFramebuffer(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');
    const prog = program;
    prog.setUniform('u_view_proj', camera.getTransformMat());

    for (const obj of objects) {
        prog.setUniform('u_model', obj.model);
        prog.setUniform('u_model_invtrs', obj.modelInvtrs);
        prog.setUniform('u_color', obj.color);
        obj.primitive.setProgram(prog);
        obj.primitive.render();
    }
}

runtime.frameRendered().on(() => {
    renderShadows();
    renderScene();
});

createControls(container, [
]);
