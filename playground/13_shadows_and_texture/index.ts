import {
    Runtime,
    Primitive,
    Camera,
    vec3,
    Mat4, translation4x4,
    Color, colors,
} from 'lib';
import { createControls } from 'util/controls';
import { makeColorProgram, makeCube, makeSphere } from './primitive';

/**
 * Shadows and texture.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);

const camera = new Camera();
camera.setEyePos(vec3(0, 3, 5));

interface ObjectInfo {
    readonly primitive: Primitive;
    readonly model: Mat4;
    readonly color: Color;
}

const objects: ReadonlyArray<ObjectInfo> = [
    {
        primitive: makeCube(runtime, 2),
        model: translation4x4(vec3(+2, 0, 0)),
        color: colors.CYAN,
    },
    {
        primitive: makeSphere(runtime, 1.5),
        model: translation4x4(vec3(-1, 0, 0)),
        color: colors.MAGENTA,
    },
];

const program = makeColorProgram(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

// function renderShadows(): void {
//     runtime.clearBuffer('color|depth');
//     cube.render();
//     sphere.render();
// }

function renderScene(): void {
    runtime.clearBuffer('color|depth');
    program.setUniform('u_view_proj', camera.getTransformMat());

    for (const obj of objects) {
        program.setUniform('u_model', obj.model);
        program.setUniform('u_color', obj.color);
        obj.primitive.setProgram(program);
        obj.primitive.render();
    }
}

runtime.frameRendered().on(() => {
    // renderShadows();
    renderScene();
});

createControls(container, [
]);
