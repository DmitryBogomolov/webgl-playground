import {
    Runtime,
    Camera,
    vec3,
} from 'lib';
import { makeObjectsFactory, SceneItem } from './primitive';

/**
 * Picking.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    const camera = new Camera();
    camera.setEyePos(vec3(0, 3, 10));
    const objects = makeObjects(runtime);

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, camera, objects);
    });
}

function renderFrame(
    runtime: Runtime, camera: Camera, objects: ReadonlyArray<SceneItem>,
): void {
    runtime.clearBuffer('color|depth');

    for (const { primitive, modelMat, normalMat } of objects) {
        primitive.program().setUniform('u_view_proj', camera.getTransformMat());
        primitive.program().setUniform('u_model', modelMat);
        primitive.program().setUniform('u_model_invtrs', normalMat);
        primitive.render();
    }
}

function makeObjects(runtime: Runtime): ReadonlyArray<SceneItem> {
    const makeObject = makeObjectsFactory(runtime);
    const objects: SceneItem[] = [
        makeObject(
            vec3(1, 0.9, 0.6), vec3(1, 0, 0), 0.3 * Math.PI, vec3(4, 0, 0),
        ),
        makeObject(
            vec3(0.7, 1, 0.8), vec3(0, 1, 0), 0.4 * Math.PI, vec3(-3, 0, 0),
        ),
        makeObject(
            vec3(0.9, 0.8, 1), vec3(0, 0, 1), 0.3 * Math.PI, vec3(0, 0, 5),
        ),
        makeObject(
            vec3(1, 0.9, 0.8), vec3(0, 1, 0), 0.2 * Math.PI, vec3(0, 0, -4),
        ),
    ];
    return objects;
}
