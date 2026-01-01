import type { Runtime, Primitive, Texture, Vec3, Mat4, Color } from 'lib';
import {
    createRenderState,
    OrbitCamera,
    divc2,
    vec3, add3,
    translation4x4,
    color, colors,
    deg2rad,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
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
    readonly camera: OrbitCamera;
    readonly primitive: Primitive;
    readonly labelPrimitive: Primitive;
    readonly objects: ReadonlyArray<ObjectInfo>;
}

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new OrbitCamera();

    const cameraLon = observable(0);
    const cameraLat = observable(10);
    const cameraDist = observable(5);
    const cameraPos = computed(
        ([cameraLon, cameraLat, cameraDist]) => ({
            dist: cameraDist,
            lon: deg2rad(cameraLon),
            lat: deg2rad(cameraLat),
        }),
        [cameraLon, cameraLat, cameraDist],
    );
    cameraPos.on((pos) => {
        camera.setPosition(pos);
    });

    const primitive = makePrimitive(runtime);
    const labelPrimitive = makeLabelPrimitive(runtime);
    const { objects, disposeObjects } = makeObjects(runtime);

    const state: State = {
        runtime,
        camera,
        primitive,
        labelPrimitive,
        objects,
    };

    runtime.frameRequested().on(() => {
        renderScene(state);
    });

    const cancelTracking = trackSize(runtime, () => {
        camera.setViewportSize(runtime.renderSize());
    });
    const cancelRender = renderOnChange(runtime, [camera]);

    const controlRoot = createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -30, max: +30 },
        { label: 'camera dist', value: cameraDist, min: 3, max: 8, step: 0.2 },
    ]);

    return () => {
        disposeAll([
            cameraLon, cameraLat, cameraDist, cameraPos, cancelTracking, cancelRender, controlRoot,
            disposeObjects, primitive.program(), primitive, labelPrimitive.program(), labelPrimitive, runtime,
        ]);
    };
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
    const canvasSize = runtime.renderSize();
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

function makeObjects(runtime: Runtime): { objects: ObjectInfo[], disposeObjects: () => void } {
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
    return { objects, disposeObjects };

    function disposeObjects(): void {
        for (const object of objects) {
            for (const label of object.labels) {
                label.texture.dispose();
            }
        }
    }
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
