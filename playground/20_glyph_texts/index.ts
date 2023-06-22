import type { Primitive, Vec2, Vec3, Mat4, Color } from 'lib';
import type { GlyphAtlas } from './glyph';
import {
    Runtime, createRenderState,
    Texture,
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
import { makeStringPrimitive, getNextLabel } from './label';
import { makeGlyphAtlas } from './glyph';

/**
 * Glyph texts.
 *
 * Shows text rendering with glyph texture.
 * Rather than making separate texture for each text, single texture is created for a set of characters.
 * Then each text is assembled from characters of that single texture.
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
    readonly primitive: Primitive;
    readonly size: Vec2;
    readonly color: Color;
}

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly atlasTexture: Texture;
    readonly primitive: Primitive;
    readonly objects: ReadonlyArray<ObjectInfo>;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setClearColor(color(0.8, 0.8, 0.8));

    const atlas = makeGlyphAtlas(FONT_SIZE);
    const texture = new Texture(runtime);
    texture.setImageData(atlas.canvas, { unpackFlipY: true, unpackPremultiplyAlpha: true });

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
        atlasTexture: texture,
        primitive: makePrimitive(runtime),
        objects: makeObjects(runtime, atlas),
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

    // container.parentElement!.appendChild(atlas.canvas);
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

function renderScene({ runtime, camera, primitive, atlasTexture, objects }: State): void {
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
    runtime.setTextureUnit(5, atlasTexture);
    for (const { labels } of objects) {
        for (const label of labels) {
            const program = label.primitive.program();
            program.setUniform('u_view_proj', viewProjMat);
            program.setUniform('u_position', label.position);
            // Texture to canvas size ratio.
            program.setUniform('u_size_coeff', divc2(label.size, canvasSize));
            // Base distance and view position for depth coeff.
            program.setUniform('u_base_distance', baseDist);
            program.setUniform('u_view_position', viewPos);
            program.setUniform('u_texture', 5);
            program.setUniform('u_color', label.color);
            label.primitive.render();
        }
    }
}

function makeObjects(runtime: Runtime, atlas: GlyphAtlas): ObjectInfo[] {
    const objects: ObjectInfo[] = [];
    const STEP = 2;
    for (let dx = -STEP; dx <= +STEP; dx += STEP) {
        for (let dy = -STEP; dy <= +STEP; dy += STEP) {
            const position = vec3(dx, dy, 0);
            objects.push({
                modelMat: translation4x4(position),
                labels: makeObjectLabels(runtime, position, atlas),
            });
        }
    }
    return objects;
}

function makeObjectLabels(runtime: Runtime, position: Vec3, atlas: GlyphAtlas): LabelInfo[] {
    return [
        {
            ...makeStringPrimitive(runtime, atlas, getNextLabel()),
            position: add3(position, vec3(-0.5, -0.5, -0.5)),
            color: colors.RED,
        },
        {
            ...makeStringPrimitive(runtime, atlas, getNextLabel()),
            position: add3(position, vec3(+0.5, +0.5, +0.5)),
            color: colors.BLUE,
        },
    ];
}
