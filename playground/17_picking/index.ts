import type { Runtime, Program, Vec2, Color } from 'lib';
import type { MainFuncInput, MainFuncOutput } from 'playground-utils/setup';
import {
    createRenderState,
    Framebuffer,
    ViewProj,
    vec2, ZERO2,
    vec3,
    color, colors,
    uint2bytes, getEventCoords,
} from 'lib';
import { trackBall } from 'playground-utils/track-ball';
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
    readonly vp: ViewProj;
    readonly idVP: ViewProj;
    readonly program: Program;
    readonly idProgram: Program;
    readonly objects: ReadonlyArray<SceneItem>;
    readonly backgroundColor: Color;
    pixelCoord: Vec2;
}

export function main({ setup, renderOnChange }: MainFuncInput): MainFuncOutput {
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
    const vp = new ViewProj();
    const idVP = new ViewProj();
    const { objects, program, idProgram, disposeObjects } = makeObjects(runtime);

    const cancelRender = renderOnChange(runtime, [vp]);

    const state: State = {
        runtime,
        framebuffer,
        vp,
        idVP,
        program,
        idProgram,
        objects,
        backgroundColor: color(0.5, 0.5, 0.5),
        pixelCoord: ZERO2,
    };

    container.addEventListener('pointermove', handlePointerMove);

    function handlePointerMove(e: PointerEvent): void {
        let coords = getEventCoords(e);
        // Flip Y coordinate.
        const canvasSize = runtime.renderSize;
        coords = vec2(coords.x, canvasSize.y - coords.y);
        state.pixelCoord = mapPixelCoodinates(coords, canvasSize, framebuffer.size());
        runtime.requestFrameRender();
    }

    runtime.renderSizeChanged.on(() => {
        const canvasSize = runtime.renderSize;
        // Framebuffer size and aspect ratio are made different to demonstrate pixel mapping issue.
        const x = canvasSize.x >> 1;
        const y = x >> 1;
        framebuffer.resize(vec2(x, y));
        vp.setViewportSize(canvasSize);
        idVP.setViewportSize(framebuffer.size());
    });
    runtime.frameRequested.on(() => {
        renderFrame(state);
    });

    const disposeTrackBall = trackBall({
        element: runtime.canvas,
        distance: { min: 4, max: 16 },
        initial: { x: 0, y: 3, z: 10 },
        callback: (v) => {
            vp.setEyePos(v);
            idVP.setEyePos(v);
        },
    });

    return [
        () => container.removeEventListener('pointermove', handlePointerMove),
        cancelRender, disposeTrackBall, disposeObjects, framebuffer, runtime,
    ];
}

function renderFrame(state: State): void {
    renderColorIds(state);
    const pixelIdx = findCurrentPixel(state);
    renderScene(state, pixelIdx);
}

function renderColorIds({ runtime, framebuffer, idVP, idProgram, objects }: State): void {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(colors.NONE);
    runtime.clearBuffer('color|depth');
    idProgram.setUniform('u_view_proj', idVP.getTransformMat());
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

function renderScene({ runtime, backgroundColor, vp, program, objects }: State, pixelIdx: number): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_proj', vp.getTransformMat());
    for (const { primitive, id, modelMat, normalMat } of objects) {
        primitive.setProgram(program);
        program.setUniform('u_model', modelMat);
        program.setUniform('u_model_invtrs', normalMat);
        program.setUniform('u_color', id === pixelIdx ? colors.GREEN : colors.RED);
        primitive.render();
    }
}

function makeObjects(runtime: Runtime): {
    objects: ReadonlyArray<SceneItem>;
    program: Program;
    idProgram: Program;
    disposeObjects: () => void;
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
