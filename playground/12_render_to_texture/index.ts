import type { Runtime, Primitive, Vec3, Mat4, Mat4Mut, Color } from 'lib';
import {
    createRenderState,
    Framebuffer,
    ViewProj,
    vec3, YUNIT3, norm3, rotate3,
    mat4, identity4x4, translation4x4, apply4x4, xrotation4x4, yrotation4x4,
    color,
    deg2rad,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observable, computed, Observable } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
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
    readonly viewProj: ViewProj;
    readonly textureViewProj: ViewProj;
    readonly framebuffer: Framebuffer;
    readonly texturePlane: Primitive;
    readonly object: Primitive;
    readonly objects: ReadonlyArray<ObjectInfo>;
    readonly targetModel: Observable<Mat4>;
}

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const xRotation = observable(0);
    const yRotation = observable(30);

    let textureCameraPos = vec3(0, 2, 5);
    const CAMERA_ROTATION_SPEED = (2 * Math.PI) * 0.1;
    const textureViewProj = new ViewProj();
    textureViewProj.setEyePos(textureCameraPos);

    const viewProj = new ViewProj();
    viewProj.setEyePos(vec3(0, 0, 2));

    const _targetModel = mat4() as Mat4Mut;
    const targetModel = computed(([xRotation, yRotation]) => {
        const mat = _targetModel;
        identity4x4(mat);
        apply4x4(mat, xrotation4x4, deg2rad(xRotation));
        apply4x4(mat, yrotation4x4, deg2rad(yRotation));
        return mat as Mat4;
    }, [xRotation, yRotation]);

    const framebuffer = new Framebuffer({
        runtime,
        attachment: 'color|depth',
        size: { x: 256, y: 256 },
    });
    textureViewProj.setViewportSize(framebuffer.size());

    const state: State = {
        runtime,
        backgroundColor: color(0.4, 0.4, 0.4),
        textureBackgroundColor: color(0.7, 0.7, 0.7),
        lightDir: norm3(vec3(1, 3, 2)),
        viewProj,
        textureViewProj,
        framebuffer,
        texturePlane: makeTexturePlane(runtime),
        object: makeObject(runtime),
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
        targetModel,
    };

    const cancelTracking = trackSize(runtime, () => {
        viewProj.setViewportSize(runtime.canvasSize());
    });

    const cancelRender = renderOnChange(runtime, [targetModel]);

    runtime.frameRequested().on((delta) => {
        if (delta < 250) {
            textureCameraPos = rotate3(textureCameraPos, YUNIT3, CAMERA_ROTATION_SPEED * delta / 1000);
        }
        textureViewProj.setEyePos(textureCameraPos);

        renderToTexture(state);
        renderScene(state);
    });

    const controlRoot = createControls(container, [
        { label: 'x rotation', value: xRotation, min: -45, max: +45 },
        { label: 'y rotation', value: yRotation, min: -45, max: +45 },
    ]);

    const animate = animation(runtime);

    return () => {
        disposeAll([
            xRotation, yRotation, targetModel,
            state.texturePlane.program(), state.texturePlane,
            state.object.program(), state.object,
            framebuffer, runtime, controlRoot, animate, cancelTracking, cancelRender,
        ]);
    };
}

function renderToTexture({
    runtime, framebuffer, textureBackgroundColor, object, objects, textureViewProj: textureCamera, lightDir,
}: State): void {
    runtime.setRenderTarget(framebuffer);
    runtime.setClearColor(textureBackgroundColor);
    runtime.clearBuffer('color|depth');

    const program = object.program();
    program.setUniform('u_view_proj', textureCamera.getTransformMat());
    program.setUniform('u_light_dir', lightDir);
    for (const { clr, model } of objects) {
        program.setUniform('u_color', clr);
        program.setUniform('u_model', model);
        object.render();
    }
}

function renderScene({
    runtime, backgroundColor, framebuffer, texturePlane, viewProj: camera, targetModel,
}: State): void {
    runtime.setRenderTarget(null);
    runtime.setClearColor(backgroundColor);
    runtime.clearBuffer('color|depth');

    runtime.setTextureUnit(2, framebuffer.texture());
    const program = texturePlane.program();
    program.setUniform('u_view_proj', camera.getTransformMat());
    program.setUniform('u_model', targetModel());
    program.setUniform('u_texture', 2);
    texturePlane.render();
}
