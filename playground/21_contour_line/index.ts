import type { Primitive, Vec3, Mat4, Mat4Mut, Color } from 'lib';
import {
    Runtime, createRenderState,
    Camera,
    vec3, mul3,
    identity4x4, apply4x4, xrotation4x4, yrotation4x4,
    color,
    deg2rad, spherical2zxy,
} from 'lib';
import { trackSize } from 'playground-utils/resizer';
import { observable, computed, Observable } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makePrimitive, makeContourPrimitive, updateContourData } from './primitive';
import { findContour } from './contour';

/**
 * Contour line.
 *
 * Draws object contour.
 * Object points are projected onto screen (2D space). Convex hull of projected points gives object contour.
 * Contour line is then rendered as 2D line of constant pixel width.
 */
export type DESCRIPTION = never;

main();

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly primitive: Primitive;
    readonly contourPrimitive: Primitive;
    readonly modelMat: Observable<Mat4>;
    readonly modelClr: Color;
    readonly modelPoints: ReadonlyArray<Vec3>;
    readonly contourEnabled: Observable<boolean>;
    readonly contourThickness: Observable<number>;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime({ element: container });
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

    const xRotation = observable(0);
    const yRotation = observable(0);
    const _modelMat = identity4x4();
    const modelMat = computed(([xRotation, yRotation]) => {
        const mat = _modelMat as Mat4Mut;
        identity4x4(mat);
        apply4x4(mat, xrotation4x4, deg2rad(xRotation));
        apply4x4(mat, yrotation4x4, deg2rad(yRotation));
        return mat as Mat4;
    }, [xRotation, yRotation]);

    const contourEnabled = observable(true);
    const contourThickness = observable(16);

    const state: State = {
        runtime,
        camera,
        primitive: makePrimitive(runtime),
        contourPrimitive: makeContourPrimitive(runtime),
        modelMat,
        modelClr: color(0.5, 0.1, 0.5),
        modelPoints: [
            vec3(-0.5, -0.5, -0.5),
            vec3(+0.5, -0.5, -0.5),
            vec3(+0.5, +0.5, -0.5),
            vec3(-0.5, +0.5, -0.5),
            vec3(-0.5, -0.5, +0.5),
            vec3(+0.5, -0.5, +0.5),
            vec3(+0.5, +0.5, +0.5),
            vec3(-0.5, +0.5, +0.5),
        ],
        contourEnabled,
        contourThickness,
    };

    runtime.frameRequested().on(() => {
        renderScene(state);
    });
    trackSize(runtime, () => {
        camera.setViewportSize(runtime.canvasSize());
    });
    [camera.changed(), modelMat].forEach((emitter) => {
        emitter.on(() => {
            updateContourPrimitive(state);
            runtime.requestFrameRender();
        });
    });
    [camera.changed(), modelMat, contourEnabled, contourThickness].forEach((emitter) => {
        emitter.on(() => {
            runtime.requestFrameRender();
        });
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -30, max: +30 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 8, step: 0.2 },
        { label: 'x rotation', value: xRotation, min: -180, max: +180 },
        { label: 'y rotation', value: yRotation, min: -180, max: +180 },
        { label: 'enabled', checked: contourEnabled },
        { label: 'thickness', value: contourThickness, min: 0, max: 32 },
    ]);
}

const objectRenderState = createRenderState({
    depthTest: true,
});
const contourRenderState = createRenderState({
    depthMask: false,
});

function renderScene({
    runtime,
    camera, primitive, contourPrimitive, modelMat, modelClr,
    contourEnabled, contourThickness,
}: State): void {
    runtime.clearBuffer('color|depth');

    runtime.setRenderState(objectRenderState);
    primitive.program().setUniform('u_view_proj', camera.getTransformMat());
    primitive.program().setUniform('u_model', modelMat());
    primitive.program().setUniform('u_color', modelClr);
    primitive.render();

    if (contourEnabled()) {
        runtime.setRenderState(contourRenderState);
        contourPrimitive.program().setUniform('u_canvas_size', runtime.canvasSize());
        contourPrimitive.program().setUniform('u_thickness', contourThickness());
        contourPrimitive.render();
    }
}

function updateContourPrimitive({ contourPrimitive, camera, modelMat, modelPoints }: State): void {
    const points = findContour(modelPoints, modelMat(), camera.getTransformMat());
    updateContourData(contourPrimitive, points);
}
