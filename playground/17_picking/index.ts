import type { Runtime, Program, Vec2, Color } from 'lib';
import {
    createRenderState,
    Framebuffer,
    ViewProj,
    vec2, ZERO2,
    vec3, mul3,
    color, colors,
    uint2bytes, makeEventCoordsGetter, spherical2zxy, deg2rad,
} from 'lib';
import { setup, disposeAll } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
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

interface State {
    readonly runtime: Runtime;
    readonly framebuffer: Framebuffer;
    readonly viewProj: ViewProj;
    readonly idViewProj: ViewProj,
    readonly program: Program;
    readonly idProgram: Program;
    readonly objects: ReadonlyArray<SceneItem>;
    readonly backgroundColor: Color;
    pixelCoord: Vec2;
}

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
    const framebuffer = new Framebuffer({
        runtime,
        attachment: 'color|depth',
        // Zero values make framebuffer incomplete.
        size: { x: 1, y: 1 },
    });
    const viewProj = new ViewProj();
    const idViewProj = new ViewProj();
    const { objects, program, idProgram, disposeObjects } = makeObjects(runtime);

    const cameraLon = observable(0);
    const cameraLat = observable(20);
    const cameraDist = observable(10);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        viewProj.setEyePos(cameraPos);
        idViewProj.setEyePos(cameraPos);
    });
    viewProj.changed().on(() => {
        runtime.requestFrameRender();
    });

    const state: State = {
        runtime,
        framebuffer,
        viewProj,
        idViewProj,
        program,
        idProgram,
        objects,
        backgroundColor: color(0.5, 0.5, 0.5),
        pixelCoord: ZERO2,
    };

    const getCoords = makeEventCoordsGetter(container);
    container.addEventListener('pointermove', handlePointerMove);

    function handlePointerMove(e: PointerEvent): void {
        let coords = getCoords(e);
        // Flip Y coordinate.
        const canvasSize = runtime.canvasSize();
        coords = vec2(coords.x, canvasSize.y - coords.y);
        state.pixelCoord = mapPixelCoodinates(coords, canvasSize, framebuffer.size());
        runtime.requestFrameRender();
    }

    const cancelTracking = trackSize(runtime, () => {
        const canvasSize = runtime.canvasSize();
        // Framebuffer size and aspect ratio are made different to demonstrate pixel mapping issue.
        const x = canvasSize.x >> 1;
        const y = x >> 1;
        framebuffer.resize(vec2(x, y));
        viewProj.setViewportSize(canvasSize);
        idViewProj.setViewportSize(framebuffer.size());
    });
    runtime.frameRequested().on(() => {
        renderFrame(state);
    });

    const controlRoot = createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -50, max: +50 },
        { label: 'camera dist', value: cameraDist, min: 4, max: 16 },
    ]);

    return () => {
        container.removeEventListener('pointermove', handlePointerMove);
        disposeAll([
            cameraLon, cameraLat, cameraDist, cameraPos,
            disposeObjects, framebuffer, runtime, cancelTracking, controlRoot,
        ]);
    };
}

function renderFrame(state: State): void {
    renderColorIds(state);
    const pixelIdx = findCurrentPixel(state);
    renderScene(state, pixelIdx);
}

function renderColorIds({ runtime, framebuffer, idViewProj, idProgram, objects }: State): void {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(colors.NONE);
    runtime.clearBuffer('color|depth');
    idProgram.setUniform('u_view_proj', idViewProj.getTransformMat());
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

function renderScene({ runtime, backgroundColor, viewProj, program, objects }: State, pixelIdx: number): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_proj', viewProj.getTransformMat());
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
    disposeObjects: () => void,
 } {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { make: makeObject, program, idProgram, dispose: disposeObjects } = makeObjectsFactory(runtime);
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
    return { objects, program, idProgram, disposeObjects };
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
