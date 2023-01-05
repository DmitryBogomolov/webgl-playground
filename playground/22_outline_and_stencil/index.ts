import {
    Runtime,
    Program,
    Camera,
    Framebuffer,
    Vec2,
    vec3, mul3,
    Mat4, mat4, clone4x4, apply4x4, frustum4x4,
    Color, color, colors,
    deg2rad, spherical2zxy,
    makeEventCoordsGetter, uint2bytes,
} from 'lib';
import { Observable, observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { Model, makeModels } from './primitive';

/**
 * Outline and stencil.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly models: ReadonlyArray<Model>;
    readonly objectProgram: Program;
    readonly outlineProgram: Program;
    readonly idProgram: Program;
    readonly framebuffer: Framebuffer;
    readonly backgroundColor: Color;
    readonly outlineColor: Color;
    readonly outlineThickness: Observable<number>;
    readonly selectedObjects: Set<number>;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container, { stencil: true });
    runtime.setDepthTest(true);
    const camera = new Camera();
    const framebuffer = new Framebuffer(runtime, {
        attachment: 'color|depth',
        size: { x: 1, y: 1 },
    });

    const cameraLon = observable(0);
    const cameraLat = observable(20);
    const cameraDist = observable(5);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    const outlineThickness = observable(10);

    const { models, objectProgram, outlineProgram, idProgram } = makeModels(runtime, [
        {
            type: 'cube',
            size: vec3(1.2, 1.3, 1.4),
            location: vec3(2, 0, 0),
            color: colors.BLUE,
        },
        {
            type: 'sphere',
            size: vec3(1.1, 0.9, 1.2),
            location: vec3(-1.5, 0, 0),
            color: colors.RED,
        },
        {
            type: 'cube',
            size: vec3(1.3, 0.9, 1.1),
            location: vec3(0, 0.4, -1.4),
            color: colors.CYAN,
        },
        {
            type: 'sphere',
            size: vec3(1.0, 1.2, 1.2),
            location: vec3(0, -0.3, 1.2),
            color: colors.MAGENTA,
        },
    ]);
    const state: State = {
        runtime,
        camera,
        models,
        backgroundColor: color(0.8, 0.8, 0.8),
        objectProgram,
        outlineProgram,
        idProgram,
        framebuffer,
        outlineColor: color(0.9, 0.9, 0),
        outlineThickness,
        selectedObjects: new Set(),
    };

    const getCoords = makeEventCoordsGetter(container);
    container.addEventListener('click', (e) => {
        const coords = getCoords(e);
        // Flip Y coordinate.
        const objectId = findObjectId(state, { x: coords.x, y: runtime.canvasSize().y - coords.y });
        if (objectId > 0) {
            if (state.selectedObjects.has(objectId)) {
                state.selectedObjects.delete(objectId);
            } else {
                state.selectedObjects.add(objectId);
            }
            runtime.requestFrameRender();
        }
    });

    runtime.frameRendered().on(() => {
        renderScene(state);
    });
    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    [camera.changed(), outlineThickness].forEach((emitter) => {
        emitter.on(() => {
            runtime.requestFrameRender();
        });
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -30, max: +30 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 8, step: 0.2 },
        { label: 'thickness', value: outlineThickness, min: 0, max: 20 },
    ]);
}

function renderScene({
    runtime, camera, backgroundColor, models,
    objectProgram, outlineProgram, outlineColor, outlineThickness,
    selectedObjects,
}: State): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth|stencil');

    console.log('@@@OBJECTS', selectedObjects);

    runtime.setDepthTest(true);
    runtime.setDepthMask(true);
    runtime.setStencilTest(true);
    runtime.setStencilMask(0xFF);
    runtime.setStencilFunc({ func: 'always', ref: 1, mask: 0xFF });
    runtime.setStencilOp({ fail: 'keep', zfail: 'replace', zpass: 'replace' });
    for (const { primitive, mat, color } of models) {
        objectProgram.setUniform('u_view_proj', camera.getTransformMat());
        objectProgram.setUniform('u_model', mat);
        objectProgram.setUniform('u_color', color);
        primitive.setProgram(objectProgram);
        primitive.render();
    }

    runtime.setDepthTest(false);
    runtime.setDepthMask(false);
    runtime.clearBuffer('depth');
    runtime.setStencilMask(0);
    runtime.setStencilFunc({ func: 'notequal', ref: 1, mask: 0xFF });
    for (const { primitive, mat } of models) {
        outlineProgram.setUniform('u_view_proj', camera.getTransformMat());
        outlineProgram.setUniform('u_model', mat);
        outlineProgram.setUniform('u_color', outlineColor);
        outlineProgram.setUniform('u_canvas_size', runtime.canvasSize());
        outlineProgram.setUniform('u_thickness', outlineThickness());
        primitive.setProgram(outlineProgram);
        primitive.render();
    }
}

function findObjectId({ runtime, framebuffer, camera, idProgram, models }: State, coords: Vec2): number {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(colors.NONE);
    runtime.clearBuffer('color|depth');

    runtime.setDepthTest(true);
    runtime.setStencilTest(false);
    const transformMat = makeIdViewProjMat(camera, coords);
    idProgram.setUniform('u_view_proj', transformMat);
    for (const { primitive, mat, id } of models) {
        primitive.setProgram(idProgram);
        idProgram.setUniform('u_model', mat);
        idProgram.setUniform('u_id', uint2bytes(id));
        primitive.render();
    }

    const buffer = new Uint8Array(4);
    runtime.readPixels(framebuffer, buffer);
    return new Uint32Array(buffer.buffer)[0];
}

const _idViewProjMat = mat4();
function makeIdViewProjMat(camera: Camera, { x, y }: Vec2): Mat4 {
    // Calculate frustum from perspective parameters.
    // |top| = |bottom| = zNear * tan(fov / 2)
    // |left| = |right| = aspect * |top|
    const dy = camera.getZNear() * Math.tan(camera.getYFov() / 2);
    const dx = camera.getAspect() * dy;
    const { x: xViewport, y: yViewport } = camera.getViewportSize();
    // Full [left, right] * [bottom, top] range corresponds to [0, viewport_width] * [0, viewport_height] screen.
    // [0, W] -> [-dx, +dx] => x -> dx * (x * 2 / W - 1)
    // [0, H] -> [-dy, +dy] => y -> dy * (y * 2 / H - 1)
    // Select part that corresponds to a specific (x, y) pixel.
    // In an arbitrary n pixels range [0, n] i-th (0 <= i < n) pixel occupies [i, i + 1] range.
    const x1 = dx * (2 * x / xViewport - 1);
    const x2 = dx * (2 * (x + 1) / xViewport - 1);
    const y1 = dy * (2 * y / yViewport - 1);
    const y2 = dy * (2 * (y + 1) / yViewport - 1);

    const mat = _idViewProjMat;
    clone4x4(camera.getViewMat(), mat);
    apply4x4(mat, frustum4x4, {
        left: x1, right: x2, bottom: y1, top: y2,
        zNear: camera.getZNear(), zFar: camera.getZFar(),
    });
    return mat;
}
