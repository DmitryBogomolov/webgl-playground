import {
    Runtime,
    Program,
    Framebuffer,
    Camera,
    vec2,
    vec3,
    vec4,
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
    const framebuffer = new Framebuffer(runtime);
    framebuffer.setup('color|depth', vec2(1024, 1024));
    const camera = new Camera();
    camera.setEyePos(vec3(0, 3, 10));
    const { objects, program, idProgram } = makeObjects(runtime);

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, framebuffer, camera, program, idProgram, objects);
    });
}

function renderFrame(
    runtime: Runtime, framebuffer: Framebuffer, camera: Camera,
    program: Program, idProgram: Program,
    objects: ReadonlyArray<SceneItem>,
): void {
    runtime.clearBuffer('color|depth');

    runtime.setFramebuffer(framebuffer);
    camera.setViewportSize(framebuffer.size());
    for (const { primitive, modelMat, normalMat } of objects) {
        primitive.setProgram(idProgram);
        idProgram.setUniform('u_view_proj', camera.getTransformMat());
        idProgram.setUniform('u_model', modelMat);
        idProgram.setUniform('u_id', vec4(1, 0, 0, 1));
        primitive.render();
    }

    runtime.setFramebuffer(null);
    camera.setViewportSize(runtime.canvasSize());
    for (const { primitive, modelMat, normalMat } of objects) {
        primitive.setProgram(program);
        program.setUniform('u_view_proj', camera.getTransformMat());
        program.setUniform('u_model', modelMat);
        program.setUniform('u_model_invtrs', normalMat);
        primitive.render();
    }
}

function makeObjects(runtime: Runtime): {
    objects: ReadonlyArray<SceneItem>,
    program: Program,
    idProgram: Program,
 } {
    const { make: makeObject, program, idProgram } = makeObjectsFactory(runtime);
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
    return { objects, program, idProgram };
}
