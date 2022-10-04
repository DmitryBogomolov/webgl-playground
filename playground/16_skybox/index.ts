import {
    Runtime,
    Primitive,
    TextureCube,
    Camera,
    mul3,
    Mat4, mat4, identity4x4, apply4x4, yrotation4x4, xrotation4x4, inversetranspose4x4,
    deg2rad, spherical2zxy,
} from 'lib';
import { Observable, observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
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

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    const quad = makeQuad(runtime);
    const cube = makeCube(runtime);
    const texture = makeTexture(runtime);
    const camera = new Camera();

    const cameraLon = observable(0);
    const cameraLat = observable(0);
    const cameraDist = observable(2);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    const modelLon = observable(0);
    const modelLat = observable(0);
    const _modelMat = mat4();
    const modelMat = computed(([modelLon, modelLat]) => {
        const mat = _modelMat;
        identity4x4(mat);
        apply4x4(mat, yrotation4x4, deg2rad(modelLon));
        apply4x4(mat, xrotation4x4, deg2rad(modelLat));
        return mat;
    }, [modelLon, modelLat]);

    const _normalMat = mat4();
    const normalMat = computed(([modelMat]) => {
        return inversetranspose4x4(modelMat, _normalMat);
    }, [modelMat]);

    const isCubeShown = observable(true);

    [modelMat, normalMat, isCubeShown, camera.changed()].forEach(
        (proxy) => proxy.on(() => runtime.requestFrameRender()),
    );
    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, camera, modelMat, normalMat, isCubeShown, quad, cube, texture);
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -360, max: +360 },
        { label: 'camera lat', value: cameraLat, min: -80, max: +80 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 5, step: 0.2 },
        { label: 'model lon', value: modelLon, min: -90, max: +90 },
        { label: 'model lat', value: modelLat, min: -90, max: +90 },
        { label: 'cube', checked: isCubeShown },
    ]);
}

function renderFrame(
    runtime: Runtime, camera: Camera,
    modelMat: Observable<Mat4>, normalMat: Observable<Mat4>, isCubeShown: Observable<boolean>,
    quad: Primitive, cube: Primitive, texture: TextureCube,
): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);

    if (isCubeShown()) {
        // Depth func is reset to default value (because it is changed for quad).
        runtime.setDepthFunc('less');
        cube.program().setUniform('u_texture', 4);
        cube.program().setUniform('u_view_proj', camera.getTransformMat());
        cube.program().setUniform('u_model', modelMat());
        cube.program().setUniform('u_model_invtrs', normalMat());
        cube.program().setUniform('u_camera_position', camera.getEyePos());
        cube.render();
    }

    // Depth buffer is cleared (by default) with "1" values. Quad depth is also "1". Depth test must be passed.
    // Default depth func is "LESS" and 1 < 1 == false. So depth func is changed.
    runtime.setDepthFunc('lequal');
    quad.program().setUniform('u_texture', 4);
    quad.program().setUniform('u_view_proj_inv', camera.getInvtransformMat());
    quad.render();
}
