import type { Runtime, Program, Vec2, Mat4Mut, Color } from 'lib';
import {
    createRenderState,
    Framebuffer,
    ViewProj,
    vec2, ZERO2,
    vec3,
    mat4,
    color, colors,
    uint2bytes, makeEventCoordsGetter, spherical2zxy, deg2rad, makePixelViewProjMat,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makeObjectsFactory, SceneItem } from './primitive';

/**
 * Frusum picking.
 *
 * Show picking technique when only 1x1 pixel framebuffer is used.
 * It is achieved by using specific frustum projection that renders only one specific pixel of the scene.
 * Look at function comments for the specifics of projection calculation.
 */
export type DESCRIPTION = never;

interface State {
    readonly runtime: Runtime;
    readonly framebuffer: Framebuffer;
    readonly viewProj: ViewProj;
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
        size: { x: 1, y: 1 },
    });
    const viewProj = new ViewProj();
    const { objects, program, idProgram, disposeObjects } = makeObjects(runtime);

    const cameraLon = observable(0);
    const cameraLat = observable(20);
    const cameraDist = observable(10);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        return spherical2zxy({
            distance: cameraDist,
            azimuth: deg2rad(cameraLon),
            elevation: deg2rad(cameraLat),
        });
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        viewProj.setEyePos(cameraPos);
    });
    const cancelRender = renderOnChange(runtime, [viewProj]);

    const state: State = {
        runtime,
        framebuffer,
        viewProj,
        program,
        idProgram,
        objects,
        backgroundColor: color(0.5, 0.5, 0.5),
        pixelCoord: ZERO2,
    };

    const getCoords = makeEventCoordsGetter(container);
    container.addEventListener('pointermove', handlePointerMove);

    function handlePointerMove(e: PointerEvent): void {
        const coords = getCoords(e);
        // Flip Y coordinate.
        state.pixelCoord = vec2(coords.x, runtime.canvasSize().y - coords.y);
        runtime.requestFrameRender();
    }

    const cancelTracking = trackSize(runtime, () => {
        viewProj.setViewportSize(runtime.canvasSize());
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
            disposeObjects, framebuffer, runtime, cancelTracking, cancelRender, controlRoot,
        ]);
    };
}

function renderFrame(state: State): void {
    const pixelIdx = findCurrentPixel(state);
    renderScene(state, pixelIdx);
}

const _transformMat = mat4();
function findCurrentPixel({ runtime, framebuffer, viewProj, objects, idProgram, pixelCoord }: State): number {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(colors.NONE);
    runtime.clearBuffer('color|depth');
    const transformMat = _transformMat as Mat4Mut;
    makePixelViewProjMat(viewProj, pixelCoord, transformMat);
    idProgram.setUniform('u_view_proj', transformMat);
    for (const { primitive, modelMat, id } of objects) {
        primitive.setProgram(idProgram);
        idProgram.setUniform('u_model', modelMat);
        idProgram.setUniform('u_id', uint2bytes(id));
        primitive.render();
    }

    const buffer = new Uint8Array(4);
    runtime.readPixels(framebuffer, buffer);
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
