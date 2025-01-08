import type { Runtime, Primitive, Program, Vec3, Mat4, Color } from 'lib';
import {
    createRenderState,
    Framebuffer,
    OrbitCamera,
    vec3,
    translation4x4, inversetranspose4x4,
    colors, color,
    deg2rad,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observablesFactory } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
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

interface ObjectInfo {
    readonly primitive: Primitive;
    readonly model: Mat4;
    readonly modelInvtrs: Mat4;
    readonly color: Color;
}

interface State {
    readonly runtime: Runtime;
    readonly program: Program;
    readonly depthProgram: Program;
    readonly framebuffer: Framebuffer;
    readonly viewProj: OrbitCamera;
    readonly depthViewProj: OrbitCamera;
    readonly backgroundColor: Color;
    readonly depthDataBackgroundColor: Color;
    readonly objects: ReadonlyArray<ObjectInfo>;
    readonly wireframe: Primitive;
}

export function main(): () => void {
    const { runtime, container } = setup({ extensions: ['depth_texture'] });
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const { observable, computed, dispose: disposeObservables } = observablesFactory();
    const viewLon = observable(0);
    const lightLon = observable(-60);
    const lightLat = observable(0);
    const lightDist = observable(5);
    // Z range should be quite small. Z precision goes down with distance from camera
    // and total Z range further affects it. So Z range should be as small as possible.
    const zNear = observable(0.5);
    const zFar = observable(10);

    const viewProj = new OrbitCamera();
    const depthViewProj = new OrbitCamera();
    viewProj.setPosition({
        dist: 6,
        lat: Math.atan2(3, 5),
        lon: 0,
    });

    viewLon.on((viewLon) => {
        viewProj.setPosition({ lon: deg2rad(viewLon) });
    });

    const lightPos = computed(
        ([lightLon, lightLat, lightDist]) => ({
            dist: lightDist,
            lon: deg2rad(lightLon),
            lat: deg2rad(lightLat),
        }),
        [lightLon, lightLat, lightDist],
    );
    lightPos.on((pos) => {
        depthViewProj.setPosition(pos);
    });

    zNear.on((zNear) => {
        depthViewProj.setZNear(zNear);
    });
    zFar.on((zFar) => {
        depthViewProj.setZFar(zFar);
    });

    const framebuffer = new Framebuffer({
        runtime,
        attachment: 'color|depth',
        useDepthTexture: true,
        size: { x: 512, y: 512 },
    });
    const program = makeProgram(runtime);
    const depthProgram = makeDepthProgram(runtime);
    const wireframe = makeWireframe(runtime);

    depthViewProj.setViewportSize(framebuffer.size());

    const cancelTracking = trackSize(runtime, () => {
        viewProj.setViewportSize(runtime.canvasSize());
    });

    const objects: ObjectInfo[] = [
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
    ];

    const state: State = {
        runtime,
        program,
        depthProgram,
        framebuffer,
        viewProj,
        depthViewProj,
        backgroundColor: color(0.7, 0.7, 0.7),
        depthDataBackgroundColor: colors.WHITE,
        objects,
        wireframe,
    };

    runtime.frameRequested().on(() => {
        renderDepthData(state);
        renderScene(state);
    });

    const cancelRender = renderOnChange(runtime, [viewProj, depthViewProj]);

    const controlRoot = createControls(container, [
        { label: 'view lon', value: viewLon, min: -180, max: +180 },
        { label: 'light lon', value: lightLon, min: -180, max: +180 },
        { label: 'light lat', value: lightLat, min: -60, max: +60 },
        { label: 'light dist', value: lightDist, min: 2, max: 10, step: 0.5 },
        { label: 'z near', value: zNear, min: 0.1, max: 2, step: 0.1 },
        { label: 'z far', value: zFar, min: 7, max: 20, step: 1 },
    ]);

    return () => {
        disposeAll([
            disposeObservables, cancelTracking, cancelRender, controlRoot,
            ...objects.map((t) => t.primitive), program, depthProgram, wireframe, framebuffer, runtime,
        ]);
    };
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

function renderObjects(
    list: ReadonlyArray<ObjectInfo>, program: Program, setUniforms: (obj: ObjectInfo) => void,
): void {
    for (const item of list) {
        setUniforms(item);
        item.primitive.setProgram(program);
        item.primitive.render();
    }
}

function renderDepthData({
    runtime, framebuffer, depthDataBackgroundColor, depthProgram, depthViewProj, objects,
}: State): void {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(depthDataBackgroundColor);
    runtime.clearBuffer('color|depth');
    depthProgram.setUniform('u_view_proj', depthViewProj.getTransformMat());
    renderObjects(objects, depthProgram, (obj) => {
        depthProgram.setUniform('u_model', obj.model);
    });
}

function renderWireframe(wireframe: Primitive, viewProj: OrbitCamera, depthViewProj: OrbitCamera): void {
    wireframe.program().setUniform('u_view_proj', viewProj.getTransformMat());
    wireframe.program().setUniform('u_model', depthViewProj.getInvtransformMat());
    wireframe.render();
}

function renderScene({
    runtime, backgroundColor, program, framebuffer, viewProj, depthViewProj, objects, wireframe,
}: State): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');
    // Color buffer (instead of depth buffer) could be used here.
    // But depth texture is used to demonstrate depth texture usage.
    runtime.setTextureUnit(4, framebuffer.depthTexture());
    program.setUniform('u_view_proj', viewProj.getTransformMat());
    program.setUniform('u_light_pos', depthViewProj.getEyePos());
    program.setUniform('u_depth_view_proj', depthViewProj.getTransformMat());
    program.setUniform('u_depth_texture', 4);
    renderObjects(objects, program, (obj) => {
        program.setUniform('u_model', obj.model);
        program.setUniform('u_model_invtrs', obj.modelInvtrs);
        program.setUniform('u_color', obj.color);
    });
    renderWireframe(wireframe, viewProj, depthViewProj);
}
