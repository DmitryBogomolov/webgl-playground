import {
    Runtime,
    Primitive,
    Camera,
    vec3,
    Mat4, translation4x4,
    color,
} from 'lib';
import { makePrimitive } from './primitive';

/**
 * Texts.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

interface ObjectInfo {
    readonly primitive: Primitive;
    readonly modelMat: Mat4;
}

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly objects: ReadonlyArray<ObjectInfo>;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new Camera();
    camera.setEyePos(vec3(0, 1, 5));

    const state: State = {
        runtime,
        camera,
        objects: makeObjects(runtime),
    };

    runtime.frameRendered().on(() => {
        renderScene(state);
    });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
}

function renderScene({ runtime, camera, objects }: State): void {
    runtime.clearBuffer('color|depth');

    for (const { primitive, modelMat } of objects) {
        const program = primitive.program();
        program.setUniform('u_view_proj', camera.getTransformMat());
        program.setUniform('u_model', modelMat);
        program.setUniform('u_color', [1, 0, 1]);
        primitive.render();
    }
}

function makeObjects(runtime: Runtime): ObjectInfo[] {
    const primitive = makePrimitive(runtime);
    const objects: ObjectInfo[] = [];
    const STEP = 2;
    for (let dx = -STEP; dx <= +STEP; dx += STEP) {
        for (let dy = -STEP; dy <= +STEP; dy += STEP) {
            objects.push({
                primitive,
                modelMat: translation4x4(vec3(dx, dy, 0)),
            });
        }
    }
    return objects;
}
