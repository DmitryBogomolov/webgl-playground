import {
    Runtime,
    Primitive,
    Camera,
    mul3,
    Mat4, identity4x4,
    Color, color,
    deg2rad, spherical2zxy,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makePrimitive } from './primitive';

/**
 * Contour line.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly primitive: Primitive;
    readonly modelMat: Mat4;
    readonly modelClr: Color;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new Camera();

    const cameraLon = observable(0);
    const cameraLat = observable(20);
    const cameraDist = observable(2);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    const state: State = {
        runtime,
        camera,
        primitive: makePrimitive(runtime),
        modelMat: identity4x4(),
        modelClr: color(0.8, 0.2, 0),
    };

    runtime.frameRendered().on(() => {
        renderScene(state);
    });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    camera.changed().on(() => {
        runtime.requestFrameRender();
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -30, max: +30 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 8, step: 0.2 },
    ]);
}

function renderScene({ runtime, camera, primitive, modelMat, modelClr }: State): void {
    runtime.clearBuffer('color|depth');

    primitive.program().setUniform('u_view_proj', camera.getTransformMat());
    primitive.program().setUniform('u_model', modelMat);
    primitive.program().setUniform('u_color', modelClr);
    primitive.render();
}
