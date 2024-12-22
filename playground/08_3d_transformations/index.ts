import type { Mat4Mut } from 'lib';
import {
    createRenderState,
    color,
    ZERO3, YUNIT3, vec3,
    mat4, mul4x4, identity4x4, perspective4x4, lookAt4x4,
} from 'lib';
import { setup } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { animation } from 'playground-utils/animation';
import { makePrimitive } from './primitive';
import { makeFigureRenderer } from './figure';

/**
 * 3D Transformations.
 *
 * Basic 3D transformations, relative transformations, camera and perspective projection.
 */
export type DESCRIPTION = never;

export function main(): void {
    const CAMERA_HEIGHT = 3;
    const CAMERA_DISTANCE = 13;
    const PI2 = Math.PI * 2;

    const { runtime } = setup();
    runtime.setClearColor(color(0.4, 0.4, 0.4));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
    const figure1 = makeFigureRenderer(
        makePrimitive(runtime),
        2, vec3(1, 8, 0), 3, +0.11 * PI2 / 1000,
    );
    const figure2 = makeFigureRenderer(
        makePrimitive(runtime),
        0.9, vec3(1, 0, 0), 4, -0.15 * PI2 / 1000,
    );
    const figure3 = makeFigureRenderer(
        makePrimitive(runtime),
        0.7, vec3(0, 0, 1), 5, +0.19 * PI2 / 1000,
    );

    const proj = mat4() as Mat4Mut;
    const view = lookAt4x4({
        eye: vec3(0, CAMERA_HEIGHT, CAMERA_DISTANCE),
        center: ZERO3,
        up: YUNIT3,
    });
    const viewProj = mat4() as Mat4Mut;
    const unit = identity4x4();

    runtime.frameRequested().on((delta) => {
        identity4x4(viewProj);
        mul4x4(view, viewProj, viewProj);
        mul4x4(proj, viewProj, viewProj);

        if (delta < 250) {
            figure1.update(viewProj, unit, delta);
            figure2.update(viewProj, figure1.model(), delta);
            figure3.update(viewProj, figure1.model(), delta);
        }

        runtime.clearBuffer('color|depth');
        figure1.render();
        figure2.render();
        figure3.render();
    });

    trackSize(runtime, () => {
        const { x, y } = runtime.canvasSize();
        perspective4x4({
            aspect: x / y,
            yFov: Math.PI / 3,
            zNear: 0.001,
            zFar: 100,
        }, proj);
    });

    animation(runtime);
}
