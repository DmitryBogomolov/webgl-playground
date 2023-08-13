import type { Program, Vec2, Color } from 'lib';
import {
    Runtime, createRenderState,
    Framebuffer,
    Camera,
    vec2, ZERO2,
    vec3, mul3,
    color, colors,
    uint2bytes, makeEventCoordsGetter, spherical2zxy, deg2rad,
} from 'lib';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makeObjectsFactory, SceneItem } from './primitive';

/**
 * Picking.
 *
 * Demonstrates how to check if some object is under pointer.
 * Scene is rendered two times.
 * First time scene is rendered into texture. Each object has unique integer id which is used as pixel color.
 * Pointer coordinates are mapped to texture coordinates, framebuffer pixels are read.
 * If selected pixel contains object id then such object is under pointer.
 * Second time scene is rendered to canvas. If required hovered object is rendered with a different color.
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
    const runtime = new Runtime({ element: container });
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
    const framebuffer = new Framebuffer({
        runtime,
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
        let coords = getCoords(e);
        // Flip Y coordinate.
        const canvasSize = runtime.canvasSize();
        coords = vec2(coords.x, canvasSize.y - coords.y);
        state.pixelCoord = mapPixelCoodinates(coords, canvasSize, framebuffer.size());
        runtime.requestFrameRender();
    });

    runtime.sizeChanged().on(() => {
        const canvasSize = runtime.canvasSize();
        // Framebuffer size and aspect ratio are made different to demonstrate pixel mapping issue.
        const x = canvasSize.x >> 1;
        const y = x >> 1;
        framebuffer.resize(vec2(x, y));
        camera.setViewportSize(canvasSize);
        idCamera.setViewportSize(framebuffer.size());
    });
    runtime.frameRequested().on(() => {
        renderFrame(state);
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -50, max: +50 },
        { label: 'camera dist', value: cameraDist, min: 4, max: 16 },
    ]);
}

function renderFrame(state: State): void {
    renderColorIds(state);
    const pixelIdx = findCurrentPixel(state);
    renderScene(state, pixelIdx);
}

function renderColorIds({ runtime, framebuffer, idCamera, idProgram, objects }: State): void {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(colors.NONE);
    runtime.clearBuffer('color|depth');
    idProgram.setUniform('u_view_proj', idCamera.getTransformMat());
    for (const { primitive, modelMat, id } of objects) {
        primitive.setProgram(idProgram);
        idProgram.setUniform('u_model', modelMat);
        idProgram.setUniform('u_id', uint2bytes(id));
        primitive.render();
    }
}

function findCurrentPixel({ runtime, framebuffer, pixelCoord }: State): number {
    const buffer = new Uint8Array(4);
    runtime.readPixels(framebuffer, buffer, { p1: pixelCoord, p2: pixelCoord });
    return new Uint32Array(buffer.buffer)[0];
}

function renderScene({ runtime, backgroundColor, camera, program, objects }: State, pixelIdx: number): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_proj', camera.getTransformMat());
    for (const { primitive, id, modelMat, normalMat } of objects) {
        primitive.setProgram(program);
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

// In perspective projection higher aspect means extra horizontal space on left and right sides.
// I.e. if some pixel has coordinate x1 in a1 aspect then in a2 > a1 aspect that pixel would have
// coordinate x2 > x1 if x1 < x_center and x2 < x1 of x1 > x_center. Y coordinate stays the same.
function mapPixelCoodinates(coords: Vec2, size1: Vec2, size2: Vec2): Vec2 {
    const aspect1 = size1.x / size1.y;
    const aspect2 = size2.x / size2.y;
    // Convert coordinates from [0, w1] * [0, h1] space to [-1, +1] * [-1, +1] space.
    // Adjust [-1, +1] coordinates assuming that aspect1 * x1 == aspect2 * x2, y1 == y2.
    const x = (2 * coords.x / size1.x - 1) * (aspect1 / aspect2);
    const y = 2 * coords.y / size1.y - 1;
    // Convert coodinates from [-1, +1] * [-1, +1] to [0, w2] * [0, h2].
    return vec2(
        Math.round(size2.x * (x + 1) / 2),
        Math.round(size2.y * (y + 1) / 2),
    );
}
