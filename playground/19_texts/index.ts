import type { Primitive, Texture, Vec3, Mat4, Color } from 'lib';
import {
    Runtime, createRenderState,
    Camera,
    divc2,
    vec3, add3, mul3,
    translation4x4,
    color, colors,
    deg2rad, spherical2zxy,
} from 'lib';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makePrimitive } from './primitive';
import { makeLabelPrimitive, makeLabelTexture } from './label';

/**
 * Texts.
 *
 * Shows text rendering.
 * Each text item has separate texture and quad primitive. The specifics are how quad points
 * are transformed to properly display generated texture. See shader code for details.
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
    readonly color: Color;
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
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new Camera();

    const cameraLon = observable(0);
    const cameraLat = observable(10);
    const cameraDist = observable(5);
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
        labelPrimitive: makeLabelPrimitive(runtime),
        objects: makeObjects(runtime),
    };

    runtime.frameRequested().on(() => {
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
        { label: 'camera dist', value: cameraDist, min: 3, max: 8, step: 0.2 },
    ]);
}

const primitiveRenderState = createRenderState({
    depthTest: true,
    blendFunc: 'one|one_minus_src_alpha',
});
const labelRenderState = createRenderState({
    depthTest: true,
    blendFunc: 'one|one_minus_src_alpha',
    depthMask: false,
    blending: true,
});

function renderScene({ runtime, camera, primitive, labelPrimitive, objects }: State): void {
    runtime.clearBuffer('color|depth');
    const viewProjMat = camera.getTransformMat();
    const canvasSize = runtime.canvasSize();
    const baseDist = camera.getViewDist();
    const viewPos = camera.getEyePos();

    runtime.setRenderState(primitiveRenderState);
    for (const { modelMat } of objects) {
        const program = primitive.program();
        program.setUniform('u_view_proj', viewProjMat);
        program.setUniform('u_model', modelMat);
        program.setUniform('u_color', [1, 0, 1]);
        primitive.render();
    }

    runtime.setRenderState(labelRenderState);
    for (const { labels } of objects) {
        for (const label of labels) {
            runtime.setTextureUnit(5, label.texture);
            const program = labelPrimitive.program();
            program.setUniform('u_view_proj', viewProjMat);
            program.setUniform('u_position', label.position);
            // Texture to canvas size ratio.
            program.setUniform('u_size_coeff', divc2(label.texture.size(), canvasSize));
            // Base distance and view position for depth coeff.
            program.setUniform('u_base_distance', baseDist);
            program.setUniform('u_view_position', viewPos);
            program.setUniform('u_texture', 5);
            program.setUniform('u_color', label.color);
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
            color: colors.RED,
        },
        {
            texture: makeLabelTexture(runtime, `${id}//(+1,+1,+1)`, FONT_SIZE),
            position: add3(position, vec3(+0.5, +0.5, +0.5)),
            color: colors.BLUE,
        },
    ];
}
