import {
    Runtime,
    Primitive,
    Texture,
    Camera,
    div2c,
    Vec3, vec3, add3,
    Mat4, translation4x4,
    color,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeLabelPrimitive, makeLabelTexture } from './label';

/**
 * Texts.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const FONT_SIZE = 24;

main();

interface ObjectInfo {
    readonly modelMat: Mat4;
    readonly labels: ReadonlyArray<LabelInfo>;
}

interface LabelInfo {
    readonly position: Vec3;
    readonly texture: Texture;
}

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly primitive: Primitive;
    readonly labelPrimitive: Primitive;
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
        primitive: makePrimitive(runtime),
        labelPrimitive: makeLabelPrimitive(runtime),
        objects: makeObjects(runtime),
    };

    runtime.frameRendered().on(() => {
        renderScene(state);
    });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });

}

function renderScene({ runtime, camera, primitive, labelPrimitive, objects }: State): void {
    runtime.clearBuffer('color|depth');
    const viewProjMat = camera.getTransformMat();
    const canvasSize = runtime.canvasSize();
    for (const { modelMat, labels } of objects) {
        const program = primitive.program();
        program.setUniform('u_view_proj', viewProjMat);
        program.setUniform('u_model', modelMat);
        program.setUniform('u_color', [1, 0, 1]);
        primitive.render();

        for (const label of labels) {
            runtime.setTextureUnit(5, label.texture);
            const program = labelPrimitive.program();
            program.setUniform('u_view_proj', viewProjMat);
            program.setUniform('u_position', label.position);
            // Pass texture to canvas size ratio.
            program.setUniform('u_size_coeff', div2c(label.texture.size(), canvasSize));
            program.setUniform('u_texture', 5);
            labelPrimitive.render();
        }
    }
}

function makeObjects(runtime: Runtime): ObjectInfo[] {
    const objects: ObjectInfo[] = [];
    const STEP = 2;
    let i = 0;
    for (let dx = -STEP; dx <= +STEP; dx += STEP) {
        for (let dy = -STEP; dy <= +STEP; dy += STEP) {
            const position = vec3(dx, dy, 0);
            objects.push({
                modelMat: translation4x4(position),
                labels: makeObjectLabels(runtime, position, `#${i}`),
            });
            ++i;
        }
    }
    return objects;
}

function makeObjectLabels(runtime: Runtime, position: Vec3, id: string): LabelInfo[] {
    return [
        {
            texture: makeLabelTexture(runtime, `${id}//(-1,-1,-1)`, FONT_SIZE),
            position: add3(position, vec3(-0.5, -0.5, -0.5)),
        },
        {
            texture: makeLabelTexture(runtime, `${id}//(+1,+1,+1)`, FONT_SIZE),
            position: add3(position, vec3(+0.5, +0.5, +0.5)),
        },
    ];
}
