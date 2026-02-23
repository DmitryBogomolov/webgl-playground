import type { Runtime, Primitive, Vec3, Mat4, Mat4Mut, Color, Vec3Mut } from 'lib';
import {
    createRenderState,
    Framebuffer,
    ViewProj,
    vec3, norm3, rotate3, YUNIT3,
    identity4x4, translation4x4, apply4x4, yrotation4x4,
    color,
    deg2rad,
    spherical2zxy,
} from 'lib';
import { setup, disposeAll } from 'playground-utils/setup';
import { animation } from 'playground-utils/animation';
import { makeObject, makeTexturePlane } from './primitive';

/**
 * Render to texture.
 *
 * Shows rendering to texture with additional depth renderbuffer.
 * In first pass scene (with animation) is rendered to texture.
 * In second pass texture is rendered over a plane.
 */
export type DESCRIPTION = never;

interface ObjectInfo {
    readonly clr: Color;
    readonly model: Mat4;
}

interface State {
    readonly runtime: Runtime;
    readonly textureBackgroundColor: Color;
    readonly backgroundColor: Color;
    readonly lightDir: Vec3;
    readonly vp: ViewProj;
    readonly textureVP: ViewProj;
    readonly framebuffer: Framebuffer;
    readonly texturePlane: Primitive;
    readonly object: Primitive;
    readonly objects: ReadonlyArray<ObjectInfo>;
    readonly targetModels: ReadonlyArray<Mat4>;
}

export function main(): () => void {
    const { runtime } = setup();
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const CAMERA_ROTATION_SPEED = (2 * Math.PI) * 0.1;
    const textureVP = new ViewProj();
    const eyePosition = spherical2zxy({ azimuth: 0, elevation: Math.atan2(2, 5), distance: 5 });

    const vp = new ViewProj();
    vp.setEyePos({ x: 0, y: 0.3, z: 3 });

    const framebuffer = new Framebuffer({
        runtime,
        attachment: 'color|depth',
        size: { x: 256, y: 256 },
    });
    textureVP.setViewportSize(framebuffer.size());

    const texturePlane = makeTexturePlane(runtime);
    const object = makeObject(runtime);

    const state: State = {
        runtime,
        backgroundColor: color(0.4, 0.4, 0.4),
        textureBackgroundColor: color(0.7, 0.7, 0.7),
        lightDir: norm3(vec3(1, 3, 2)),
        vp,
        textureVP,
        framebuffer,
        texturePlane,
        object,
        objects: [
            {
                clr: color(0.8, 0.2, 0.1),
                model: translation4x4(vec3(+1.4, 0, 0)),
            },
            {
                clr: color(0.3, 0.5, 0.9),
                model: translation4x4(vec3(0, 0, +1.2)),
            },
            {
                clr: color(0.8, 0.1, 0.4),
                model: translation4x4(vec3(-1.5, 0, 0)),
            },
            {
                clr: color(0.3, 0.9, 0.2),
                model: translation4x4(vec3(0, 0, -1.6)),
            },
        ],
        targetModels: [
            makeTargetMat(+45, -2.5),
            makeTargetMat(0, 0),
            makeTargetMat(-45, +2.5),
        ],
    };

    runtime.renderSizeChanged().on(() => {
        vp.setViewportSize(runtime.renderSize());
    });

    runtime.frameRequested().on(({ delta }) => {
        if (delta < 250) {
            rotate3(eyePosition, YUNIT3, CAMERA_ROTATION_SPEED * delta / 1000, eyePosition as Vec3Mut);
        }
        textureVP.setEyePos(eyePosition);

        renderToTexture(state);
        renderScene(state);
    });

    const animate = animation(runtime);

    return () => {
        disposeAll([
            animate, texturePlane.program(), texturePlane, object.program(), object, framebuffer, runtime,
        ]);
    };
}

function renderToTexture({
    runtime, framebuffer, textureBackgroundColor, object, objects, textureVP, lightDir,
}: State): void {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(textureBackgroundColor);
    runtime.clearBuffer('color|depth');

    const program = object.program();
    program.setUniform('u_view_proj', textureVP.getTransformMat());
    program.setUniform('u_light_dir', lightDir);
    for (const { clr, model } of objects) {
        program.setUniform('u_color', clr);
        program.setUniform('u_model', model);
        object.render();
    }
}

function renderScene({
    runtime, backgroundColor, framebuffer, texturePlane, vp, targetModels,
}: State): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');

    runtime.setTextureUnit(2, framebuffer.texture());
    const program = texturePlane.program();
    program.setUniform('u_view_proj', vp.getTransformMat());
    program.setUniform('u_texture', 2);
    for (const model of targetModels) {
        program.setUniform('u_model', model);
        texturePlane.render();
    }
}

function makeTargetMat(rotate: number, offset: number): Mat4 {
    const mat = identity4x4() as Mat4Mut;
    apply4x4(mat, yrotation4x4, deg2rad(rotate));
    apply4x4(mat, translation4x4, vec3(offset, 0, 0));
    return mat as Mat4;
}
