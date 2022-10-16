import {
    Runtime,
    Program,
    Framebuffer,
    Camera,
    Vec2, vec2, ZERO2,
    vec3, mul3,
    Mat4, mat4, apply4x4, clone4x4, frustum4x4,
    Color, color, colors,
    uint2bytes, makeEventCoordsGetter, spherical2zxy, deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeObjectsFactory, SceneItem } from './primitive';

/**
 * Frusum picking.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

interface State {
    readonly runtime: Runtime;
    readonly framebuffer: Framebuffer;
    readonly camera: Camera;
    readonly idCamera: Camera,
    readonly program: Program;
    readonly idProgram: Program;
    readonly objects: ReadonlyArray<SceneItem>;
    readonly backgroundColor: Color;
    pixelCoord: Vec2;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    const framebuffer = new Framebuffer(runtime, {
        attachment: 'color|depth',
        // Zero values make framebuffer incomplete.
        size: { x: 1, y: 1 },
    });
    const camera = new Camera();
    const idCamera = new Camera();
    const { objects, program, idProgram } = makeObjects(runtime);

    const cameraLon = observable(0);
    const cameraLat = observable(20);
    const cameraDist = observable(10);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
        idCamera.setEyePos(cameraPos);
    });
    camera.changed().on(() => {
        runtime.requestFrameRender();
    });

    const state: State = {
        runtime,
        framebuffer,
        camera,
        idCamera,
        program,
        idProgram,
        objects,
        backgroundColor: color(0.5, 0.5, 0.5),
        pixelCoord: ZERO2,
    };

    const getCoords = makeEventCoordsGetter(container);
    container.addEventListener('pointermove', (e) => {
        const coords = getCoords(e);
        // Flip Y coordinate.
        state.pixelCoord = vec2(coords.x, runtime.canvasSize().y - coords.y);
        runtime.requestFrameRender();
    });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(state);
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -50, max: +50 },
        { label: 'camera dist', value: cameraDist, min: 4, max: 16 },
    ]);
}

function renderFrame(state: State): void {
    const pixelIdx = findCurrentPixel(state);
    renderScene(state, pixelIdx);
}

function findCurrentPixel({ runtime, framebuffer, camera, objects, idProgram, pixelCoord }: State): number {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(colors.NONE);
    runtime.clearBuffer('color|depth');

    const transformMat = makeIdViewProjMat(camera, pixelCoord);
    for (const { primitive, modelMat, id } of objects) {
        primitive.setProgram(idProgram);
        idProgram.setUniform('u_view_proj', transformMat);
        idProgram.setUniform('u_model', modelMat);
        idProgram.setUniform('u_id', uint2bytes(id));
        primitive.render();
    }

    const buffer = new Uint8Array(4);
    runtime.readPixels(framebuffer, buffer);
    return new Uint32Array(buffer.buffer)[0];
}

function renderScene({ runtime, backgroundColor, camera, program, objects }: State, pixelIdx: number): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');

    for (const { primitive, id, modelMat, normalMat } of objects) {
        primitive.setProgram(program);
        program.setUniform('u_view_proj', camera.getTransformMat());
        program.setUniform('u_model', modelMat);
        program.setUniform('u_model_invtrs', normalMat);
        program.setUniform('u_color', id === pixelIdx ? colors.GREEN : colors.RED);
        primitive.render();
    }
}

function makeObjects(runtime: Runtime): {
    objects: ReadonlyArray<SceneItem>,
    program: Program,
    idProgram: Program,
 } {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { make: makeObject, program, idProgram } = makeObjectsFactory(runtime);
    const objects: SceneItem[] = [
        makeObject(
            201, vec3(1, 0.9, 0.6), vec3(1, 0, 0), 0.3 * Math.PI, vec3(4, 0, 0),
        ),
        makeObject(
            202, vec3(0.7, 1, 0.8), vec3(0, 1, 0), 0.4 * Math.PI, vec3(-3, 0, 0),
        ),
        makeObject(
            203, vec3(0.9, 0.8, 1), vec3(0, 0, 1), 0.3 * Math.PI, vec3(0, 0, 5),
        ),
        makeObject(
            204, vec3(1, 0.9, 0.8), vec3(0, 1, 0), 0.2 * Math.PI, vec3(0, 0, -4),
        ),
    ];
    return { objects, program, idProgram };
}

const _idViewProjMat = mat4();
function makeIdViewProjMat(camera: Camera, { x, y }: Vec2): Mat4 {
    const dy = camera.getZNear() * Math.tan(camera.getYFov() / 2);
    const dx = camera.getAspect() * dy;
    const { x: xViewport, y: yViewport } = camera.getViewportSize();
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
