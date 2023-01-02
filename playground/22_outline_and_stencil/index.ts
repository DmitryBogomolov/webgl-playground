import {
    Runtime,
    Program,
    Camera,
    vec3, mul3,
    Color, color, colors,
    deg2rad, spherical2zxy,
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
    readonly outlineColor: Color;
    readonly outlineThickness: Observable<number>;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container, { stencil: true });
    runtime.setDepthTest(true);
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new Camera();

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

    const { models, objectProgram, outlineProgram } = makeModels(runtime, [
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
        objectProgram,
        outlineProgram,
        outlineColor: color(0.9, 0.9, 0),
        outlineThickness,
    };

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
    runtime, camera, models, objectProgram, outlineProgram, outlineColor, outlineThickness,
}: State): void {
    runtime.clearBuffer('color|depth|stencil');

    runtime.setStencilTest(true);
    runtime.setStencilMask(0xFF);
    runtime.setStencilFunc({ func: 'always', ref: 1, mask: 0xFF });
    runtime.setStencilOp({ fail: 'keep', zfail: 'keep', zpass: 'replace' });
    for (const { primitive, mat, color } of models) {
        objectProgram.setUniform('u_view_proj', camera.getTransformMat());
        objectProgram.setUniform('u_model', mat);
        objectProgram.setUniform('u_color', color);
        primitive.setProgram(objectProgram);
        primitive.render();
    }

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
