import type { Runtime, Primitive, Vec3, Color } from 'lib';
import type { Observable } from 'playground-utils/observable';
import {
    createRenderState,
    OrbitCamera,
    vec3,
    color,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { observable } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makePrimitive, makeContourPrimitive, updateContourData } from './primitive';
import { findContour } from './contour';
import { trackBall } from 'playground-utils/track-ball';

/**
 * Contour line.
 *
 * Draws object contour.
 * Object points are projected onto screen (2D space). Convex hull of projected points gives object contour.
 * Contour line is then rendered as 2D line of constant pixel width.
 */
export type DESCRIPTION = never;

interface State {
    readonly runtime: Runtime;
    readonly camera: OrbitCamera;
    readonly primitive: Primitive;
    readonly contourPrimitive: Primitive;
    readonly modelClr: Color;
    readonly modelPoints: ReadonlyArray<Vec3>;
    readonly contourEnabled: Observable<boolean>;
    readonly contourThickness: Observable<number>;
}

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new OrbitCamera();

    const contourEnabled = observable(true);
    const contourThickness = observable(16);

    const primitive = makePrimitive(runtime);
    const contourPrimitive = makeContourPrimitive(runtime);

    const state: State = {
        runtime,
        camera,
        primitive,
        contourPrimitive,
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

    runtime.renderSizeChanged().on(() => {
        camera.setViewportSize(runtime.renderSize());
    });
    runtime.frameRequested().on(() => {
        renderScene(state);
    });
    camera.changed().on(() => {
        updateContourPrimitive(state);
    });
    const disposeTrackBall = trackBall({
        element: runtime.canvas(),
        distance: { min: 2, max: 4 },
        initial: { x: 0, y: 1, z: 2 },
        callback: (v) => {
            camera.setEyePos(v);
        },
    });
    const cancelRender = renderOnChange(runtime, [camera, contourEnabled, contourThickness]);

    const controlRoot = createControls(container, [
        { label: 'enabled', checked: contourEnabled },
        { label: 'thickness', value: contourThickness, min: 0, max: 32 },
    ]);

    return () => {
        disposeAll([cancelRender, disposeTrackBall, controlRoot, primitive, contourPrimitive, runtime]);
    };
}

const objectRenderState = createRenderState({
    depthTest: true,
});
const contourRenderState = createRenderState({
    depthMask: false,
});

function renderScene({
    runtime,
    camera,
    primitive,
    contourPrimitive,
    modelClr,
    contourEnabled,
    contourThickness,
}: State): void {
    runtime.clearBuffer('color|depth');

    runtime.setRenderState(objectRenderState);
    primitive.program().setUniform('u_view_proj', camera.getTransformMat());
    primitive.program().setUniform('u_color', modelClr);
    primitive.render();

    if (contourEnabled()) {
        runtime.setRenderState(contourRenderState);
        contourPrimitive.program().setUniform('u_canvas_size', runtime.renderSize());
        contourPrimitive.program().setUniform('u_thickness', contourThickness());
        contourPrimitive.render();
    }
}

function updateContourPrimitive({ contourPrimitive, camera, modelPoints }: State): void {
    const points = findContour(modelPoints, camera.getTransformMat());
    updateContourData(contourPrimitive, points);
}
