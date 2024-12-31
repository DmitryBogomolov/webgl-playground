import type { Runtime, Primitive, Vec2, Vec3, Mat4, Color, Program } from 'lib';
import type { GlyphAtlas } from './glyph';
import {
    createRenderState,
    Texture,
    ViewProj,
    divc2,
    vec3, add3, mul3,
    translation4x4,
    color, colors,
    deg2rad, spherical2zxy,
} from 'lib';
import { setup, disposeAll } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makePrimitive } from './primitive';
import { makeStringPrimitive, makeStringProgram, getNextLabel } from './label';
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
    readonly viewProj: ViewProj;
    readonly atlasTexture: Texture;
    readonly primitive: Primitive;
    readonly objects: ReadonlyArray<ObjectInfo>;
}

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.8, 0.8, 0.8));

    const atlas = makeGlyphAtlas(FONT_SIZE);
    const atlasTexture = new Texture({ runtime });
    atlasTexture.setImageData(atlas.canvas, { unpackFlipY: true, unpackPremultiplyAlpha: true });

    const primitive = makePrimitive(runtime);
    const { objects, disposeObjects } = makeObjects(runtime, atlas);

    const viewProj = new ViewProj();
    const cameraLon = observable(0);
    const cameraLat = observable(10);
    const cameraDist = observable(5);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        viewProj.setEyePos(cameraPos);
    });

    const state: State = {
        runtime,
        viewProj,
        atlasTexture,
        primitive,
        objects,
    };

    runtime.frameRequested().on(() => {
        renderScene(state);
    });

    const cancelTracking = trackSize(runtime, () => {
        viewProj.setViewportSize(runtime.canvasSize());
    });
    viewProj.changed().on(() => {
        runtime.requestFrameRender();
    });

    const controlRoot = createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -30, max: +30 },
        { label: 'camera dist', value: cameraDist, min: 3, max: 8, step: 0.2 },
    ]);

    return () => {
        disposeAll([
            cameraLon, cameraLat, cameraDist, cameraPos,
            disposeObjects, primitive.program(), primitive, atlasTexture,
            runtime, cancelTracking, controlRoot,
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

function renderScene({ runtime, viewProj, primitive, atlasTexture, objects }: State): void {
    runtime.clearBuffer('color|depth');
    const viewProjMat = viewProj.getTransformMat();
    const canvasSize = runtime.canvasSize();
    const baseDist = viewProj.getViewDist();
    const viewPos = viewProj.getEyePos();

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

function makeObjects(runtime: Runtime, atlas: GlyphAtlas): { objects: ObjectInfo[], disposeObjects: () => void } {
    const objects: ObjectInfo[] = [];
    const STEP = 2;
    const program = makeStringProgram(runtime);
    for (let dx = -STEP; dx <= +STEP; dx += STEP) {
        for (let dy = -STEP; dy <= +STEP; dy += STEP) {
            const position = vec3(dx, dy, 0);
            objects.push({
                modelMat: translation4x4(position),
                labels: makeObjectLabels(runtime, program, position, atlas),
            });
        }
    }
    return { objects, disposeObjects };

    function disposeObjects(): void {
        program.dispose();
        for (const object of objects) {
            for (const label of object.labels) {
                label.primitive.dispose();
            }
        }
    }
}

function makeObjectLabels(runtime: Runtime, program: Program, position: Vec3, atlas: GlyphAtlas): LabelInfo[] {
    return [
        {
            ...makeStringPrimitive(runtime, program, atlas, getNextLabel()),
            position: add3(position, vec3(-0.5, -0.5, -0.5)),
            color: colors.RED,
        },
        {
            ...makeStringPrimitive(runtime, program, atlas, getNextLabel()),
            position: add3(position, vec3(+0.5, +0.5, +0.5)),
            color: colors.BLUE,
        },
    ];
}
