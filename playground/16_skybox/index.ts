import type { Runtime, Primitive, TextureCube, Mat4, Mat4Mut } from 'lib';
import type { Observable } from 'playground-utils/observable';
import {
    createRenderState,
    OrbitCamera,
    mat4, identity4x4, apply4x4, yrotation4x4, xrotation4x4, inversetranspose4x4,
    deg2rad,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observablesFactory } from 'playground-utils/observable';
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
    readonly camera: OrbitCamera;
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
    const camera = new OrbitCamera();

    const { observable, computed, dispose: disposeObservables } = observablesFactory();
    const cameraLon = observable(0);
    const cameraLat = observable(0);
    const cameraDist = observable(2);
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

    const _normalMat = mat4() as Mat4Mut;
    const normalMat = computed(
        ([modelMat]) => inversetranspose4x4(modelMat, _normalMat),
        [modelMat],
    );

    const isCubeShown = observable(true);

    const cancelRender = renderOnChange(runtime, [modelMat, normalMat, isCubeShown, camera]);
    const cancelTracking = trackSize(runtime, () => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRequested().on(() => {
        renderFrame({ runtime, camera: camera, modelMat, normalMat, isCubeShown, quad, cube, texture });
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
            disposeObservables, cancelTracking, cancelRender, controlRoot,
            quad.program(), quad, cube.program(), cube, texture, runtime,
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
    runtime, camera, modelMat, normalMat, isCubeShown, quad, cube, texture,
}: State): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);

    if (isCubeShown()) {
        // Depth func is reset to default value (because it is changed for quad).
        runtime.setRenderState(defaultRenderState);
        cube.program().setUniform('u_texture', 4);
        cube.program().setUniform('u_view_proj', camera.getTransformMat());
        cube.program().setUniform('u_model', modelMat());
        cube.program().setUniform('u_model_invtrs', normalMat());
        cube.program().setUniform('u_camera_position', camera.getEyePos());
        cube.render();
    }

    runtime.setRenderState(quadRenderState);
    quad.program().setUniform('u_texture', 4);
    quad.program().setUniform('u_view_proj_inv', camera.getInvtransformMat());
    quad.render();
}
