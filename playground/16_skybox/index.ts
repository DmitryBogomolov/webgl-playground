import type { Runtime, Primitive, TextureCube, Mat4, Mat4Mut } from 'lib';
import type { Observable } from 'playground-utils/observable';
import {
    createRenderState,
    ViewProj,
    mul3,
    mat4, identity4x4, apply4x4, yrotation4x4, xrotation4x4, inversetranspose4x4,
    deg2rad, spherical2zxy,
} from 'lib';
import { setup, disposeAll } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makeQuad, makeCube } from './primitive';
import { makeTexture } from './texture';

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
    readonly viewProj: ViewProj;
    readonly modelMat: Observable<Mat4>;
    readonly normalMat: Observable<Mat4>;
    readonly isCubeShown: Observable<boolean>;
    readonly quad: Primitive;
    readonly cube: Primitive;
    readonly texture: TextureCube;
}

export function main(): () => void {
    const { runtime, container } = setup();
    const quad = makeQuad(runtime);
    const cube = makeCube(runtime);
    const texture = makeTexture(runtime);
    const viewProj = new ViewProj();

    const cameraLon = observable(0);
    const cameraLat = observable(0);
    const cameraDist = observable(2);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        viewProj.setEyePos(cameraPos);
    });

    const modelLon = observable(0);
    const modelLat = observable(0);
    const _modelMat = mat4();
    const modelMat = computed(([modelLon, modelLat]) => {
        const mat = _modelMat as Mat4Mut;
        identity4x4(mat);
        apply4x4(mat, yrotation4x4, deg2rad(modelLon));
        apply4x4(mat, xrotation4x4, deg2rad(modelLat));
        return mat as Mat4;
    }, [modelLon, modelLat]);

    const _normalMat = mat4();
    const normalMat = computed(([modelMat]) => {
        return inversetranspose4x4(modelMat, _normalMat as Mat4Mut);
    }, [modelMat]);

    const isCubeShown = observable(true);

    [modelMat, normalMat, isCubeShown, viewProj.changed()].forEach(
        (proxy) => proxy.on(() => runtime.requestFrameRender()),
    );
    const cancelTracking = trackSize(runtime, () => {
        viewProj.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRequested().on(() => {
        renderFrame({ runtime, viewProj, modelMat, normalMat, isCubeShown, quad, cube, texture });
    });

    const controlRoot = createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -360, max: +360 },
        { label: 'camera lat', value: cameraLat, min: -80, max: +80 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 5, step: 0.2 },
        { label: 'model lon', value: modelLon, min: -90, max: +90 },
        { label: 'model lat', value: modelLat, min: -90, max: +90 },
        { label: 'cube', checked: isCubeShown },
    ]);

    return () => {
        disposeAll([
            cameraLon, cameraLat, cameraDist, cameraPos, modelLon, modelLat, modelMat, normalMat, isCubeShown,
            quad.program(), quad, cube.program(), cube, texture,
            runtime, cancelTracking, controlRoot,
        ]);
    };
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
    runtime, viewProj, modelMat, normalMat, isCubeShown, quad, cube, texture,
}: State): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);

    if (isCubeShown()) {
        // Depth func is reset to default value (because it is changed for quad).
        runtime.setRenderState(defaultRenderState);
        cube.program().setUniform('u_texture', 4);
        cube.program().setUniform('u_view_proj', viewProj.getTransformMat());
        cube.program().setUniform('u_model', modelMat());
        cube.program().setUniform('u_model_invtrs', normalMat());
        cube.program().setUniform('u_camera_position', viewProj.getEyePos());
        cube.render();
    }

    runtime.setRenderState(quadRenderState);
    quad.program().setUniform('u_texture', 4);
    quad.program().setUniform('u_view_proj_inv', viewProj.getInvtransformMat());
    quad.render();
}
