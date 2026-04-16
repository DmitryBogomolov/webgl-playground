import type { Runtime, Primitive, TextureCube, Mat4, Mat4Mut } from 'lib';
import type { MainFuncInput, MainFuncOutput } from 'playground-utils/setup';
import type { Observable } from 'playground-utils/observable';
import {
    createRenderState,
    ViewProj,
    mat4, identity4x4, apply4x4, yrotation4x4, xrotation4x4, inversetranspose4x4,
    deg2rad,
} from 'lib';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makeQuad, makeCube } from './primitive';
import { makeTexture } from './texture';
import { trackBall } from 'playground-utils/track-ball';

/**
 * Skybox.
 *
 * Skybox is represented with cube texture. Rendrered with a `[-1, +1] x [-1, +1]` quad.
 * The quad fully covers viewport in NDC space. For each pixel NDC coordinate is transformed back to world space.
 * It gives direction from eye to pixel. The direction is used as texture coordinate.
 *
 * There is also a cube with environment mapping. Behaves like a mirror.
 * Direction from eye to cube surface is reflected and used as texture coordinate.
 */
export type DESCRIPTION = never;

interface State {
    readonly runtime: Runtime;
    readonly vp: ViewProj;
    readonly modelMat: Observable<Mat4>;
    readonly normalMat: Observable<Mat4>;
    readonly isCubeShown: Observable<boolean>;
    readonly quad: Primitive;
    readonly cube: Primitive;
    readonly texture: TextureCube;
}

export function main({ setup, renderOnChange }: MainFuncInput): MainFuncOutput {
    const { runtime, container } = setup();
    const quad = makeQuad(runtime);
    const cube = makeCube(runtime);
    const texture = makeTexture(runtime);
    const vp = new ViewProj();

    const modelLon = observable(0);
    const modelLat = observable(0);
    const _modelMat = mat4() as Mat4Mut;
    const modelMat = computed(
        ([modelLon, modelLat]) => {
            const mat = _modelMat;
            identity4x4(mat);
            apply4x4(mat, yrotation4x4, deg2rad(modelLon));
            apply4x4(mat, xrotation4x4, deg2rad(modelLat));
            return mat as Mat4;
        },
        [modelLon, modelLat],
    );
    const disposeTrackBall = trackBall({
        element: runtime.canvas,
        distance: { min: 1, max: 5 },
        initial: { x: 0, y: 0, z: 2 },
        callback: (v) => {
            vp.setEyePos(v);
        },
    });

    const _normalMat = mat4() as Mat4Mut;
    const normalMat = computed(
        ([modelMat]) => inversetranspose4x4(modelMat, _normalMat),
        [modelMat],
    );

    const isCubeShown = observable(true);

    const cancelRender = renderOnChange(runtime, [modelMat, normalMat, isCubeShown, vp]);
    runtime.renderSizeChanged.on(() => {
        vp.setViewportSize(runtime.renderSize);
    });
    runtime.frameRequested.on(() => {
        renderFrame({ runtime, vp, modelMat, normalMat, isCubeShown, quad, cube, texture });
    });

    const controlRoot = createControls(container, [
        { label: 'model lon', value: modelLon, min: -90, max: +90 },
        { label: 'model lat', value: modelLat, min: -90, max: +90 },
        { label: 'cube', checked: isCubeShown },
    ]);

    return [
        cancelRender, controlRoot, disposeTrackBall,
        quad.program(), quad, cube.program(), cube, texture, runtime,
    ];
}

const defaultRenderState = createRenderState({
    depthTest: true,
});

const quadRenderState = createRenderState({
    depthTest: true,
    // Depth buffer is cleared (by default) with "1" values. Quad depth is also "1". Depth test must be passed.
    // Default depth func is "LESS" and 1 < 1 == false. So depth func is changed.
    depthFunc: 'lequal',
});

function renderFrame({
    runtime, vp, modelMat, normalMat, isCubeShown, quad, cube, texture,
}: State): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);

    if (isCubeShown()) {
        // Depth func is reset to default value (because it is changed for quad).
        runtime.setRenderState(defaultRenderState);
        cube.program().setUniform('u_texture', 4);
        cube.program().setUniform('u_view_proj', vp.getTransformMat());
        cube.program().setUniform('u_model', modelMat());
        cube.program().setUniform('u_model_invtrs', normalMat());
        cube.program().setUniform('u_camera_position', vp.getEyePos());
        cube.render();
    }

    runtime.setRenderState(quadRenderState);
    quad.program().setUniform('u_texture', 4);
    quad.program().setUniform('u_view_proj_inv', vp.getInvtransformMat());
    quad.render();
}
