import {
    Runtime,
    Primitive,
    Framebuffer,
    Camera,
    Vec3, vec3, mul3,
    Mat4, translation4x4, inversetranspose4x4,
    Color, colors, color, Program,
    deg2rad, spherical2zxy,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeProgram, makeDepthProgram, makeCube, makeSphere, makeWireframe } from './primitive';

/**
 * Shadows and texture.
 *
 * Shows how to implement shadows using rendering to texture.
 * In first pass scene is rendered from the point of view of the "light source".
 * Depth buffer is then used as texture for the second pass.
 * In second pass scene is rendered with default point of view.
 * For each pixel its current depth is compared to its depth in texture from the first pass (projection mapping).
 * If current depth is greater than texture depth than it means that this pixel is overlapped by some other pixel
 * from the "light source" perspective. Hence it is considered shadowed.
 *
 * Projection mapping technique is used to sample pixel depth from depth texture.
 * Z range for projection mapping must be treated with caution
 * because good depth precision is required for depth texture.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container, { extensions: ['depth_texture'] });
runtime.setDepthTest(true);

const backgroundColor = color(0.7, 0.7, 0.7);
const depthDataBackgroundColor = color(1, 1, 1);

const viewLon = observable(0);
const lightLon = observable(-60);
const lightLat = observable(0);
const lightDist = observable(5);
// Z range should be quite small. Z precision goes down with distance from camera
// and total Z range further affects it. So Z range should be as small as possible.
const zNear = observable(0.5);
const zFar = observable(10);

const depthCamera = new Camera();
const camera = new Camera();
camera.setEyePos(vec3(-2, 3, 5));

viewLon.on((viewLon) => {
    const lon = deg2rad(viewLon);
    const pos = vec3(
        5 * Math.sin(lon),
        3,
        5 * Math.cos(lon),
    );
    camera.setEyePos(pos);
});

const lightPos = computed(([lightLon, lightLat, lightDist]) => {
    const dir = spherical2zxy({ azimuth: deg2rad(lightLon), elevation: deg2rad(lightLat) });
    return mul3(dir, lightDist);
}, [lightLon, lightLat, lightDist]);

lightPos.on((lightPos) => {
    depthCamera.setEyePos(lightPos);
});
zNear.on((zNear) => {
    depthCamera.setZNear(zNear);
});
zFar.on((zFar) => {
    depthCamera.setZFar(zFar);
});

const framebuffer = new Framebuffer(runtime, {
    attachment: 'color|depth',
    useDepthTexture: true,
    size: { x: 512, y: 512 },
});
depthCamera.setViewportSize(framebuffer.size());

interface ObjectInfo {
    readonly primitive: Primitive;
    readonly model: Mat4;
    readonly modelInvtrs: Mat4;
    readonly color: Color;
}
function makeObject(primitive: Primitive, offset: Vec3, clr: Color): ObjectInfo {
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
        makeCube(runtime, 1.8),
        vec3(+2, 0, 1),
        colors.CYAN,
    ),
    makeObject(
        makeSphere(runtime, 1.5),
        vec3(-1, 0, 1),
        colors.MAGENTA,
    ),
    makeObject(
        makeSphere(runtime, 1.2),
        vec3(0, 0, -2),
        colors.BLUE,
    ),
] as const;

const program = makeProgram(runtime);
const depthProgram = makeDepthProgram(runtime);
const wireframe = makeWireframe(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

function renderObjects(
    list: ReadonlyArray<ObjectInfo>, program: Program, setUniforms: (obj: ObjectInfo) => void,
): void {
    for (const item of list) {
        setUniforms(item);
        item.primitive.setProgram(program);
        item.primitive.render();
    }
}

function renderDepthData(program: Program, camera: Camera): void {
    runtime.setFramebuffer(framebuffer);
    runtime.setClearColor(depthDataBackgroundColor);
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_proj', camera.getTransformMat());
    renderObjects(objects, program, (obj) => {
        program.setUniform('u_model', obj.model);
    });
}

function renderWireframe(): void {
    wireframe.program().setUniform('u_view_proj', camera.getTransformMat());
    wireframe.program().setUniform('u_model', depthCamera.getInvtransformMat());
    wireframe.render();
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
    renderObjects(objects, program, (obj) => {
        program.setUniform('u_model', obj.model);
        program.setUniform('u_model_invtrs', obj.modelInvtrs);
        program.setUniform('u_color', obj.color);
    });
    renderWireframe();
}

runtime.frameRendered().on(() => {
    renderDepthData(depthProgram, depthCamera);
    renderScene(program, camera, depthCamera);
});

[camera.changed(), depthCamera.changed()].forEach((item) => {
    item.on(() => runtime.requestFrameRender());
});

createControls(container, [
    { label: 'view lon', value: viewLon, min: -180, max: +180 },
    { label: 'light lon', value: lightLon, min: -180, max: +180 },
    { label: 'light lat', value: lightLat, min: -60, max: +60 },
    { label: 'light dist', value: lightDist, min: 2, max: 10, step: 0.5 },
    { label: 'z near', value: zNear, min: 0.1, max: 2, step: 0.1 },
    { label: 'z far', value: zFar, min: 7, max: 20, step: 1 },
]);
