import {
    Runtime,
    Primitive,
    TextureCube,
    Camera,
    vec3, mul3,
    deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeQuad, makeCube } from './primitive';
import { makeTexture } from './texture';


/**
 * Skybox.
 *
 * TODO...
 */
export type DESCRIPTION = never;

// TODO: Investigate inversion.
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
        const lon = deg2rad(cameraLon);
        const lat = deg2rad(cameraLat);
        const dir = vec3(
            Math.cos(lat) * Math.sin(lon),
            Math.sin(lat),
            Math.cos(lat) * Math.cos(lon),
        );
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    camera.changed().on(() => runtime.requestFrameRender());
    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, camera, quad, cube, texture);
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -80, max: +80 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 5, step: 0.2 },
    ]);
}

function renderFrame(runtime: Runtime, camera: Camera, quad: Primitive, cube: Primitive, texture: TextureCube): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);

    // Depth func is reset to default value (because it is changed for quad).
    runtime.setDepthFunc('less');
    cube.program().setUniform('u_texture', 4);
    cube.program().setUniform('u_view_proj', camera.getTransformMat());
    cube.program().setUniform('u_camera_position', camera.getEyePos());
    cube.render();

    // Depth buffer is cleared (by default) with "1" values. Quad depth is also "1". Depth test must be passed.
    // Default depth func is "LESS" and 1 < 1 == false. So depth func is changed.
    runtime.setDepthFunc('lequal');
    quad.program().setUniform('u_texture', 4);
    quad.program().setUniform('u_view_proj_inv', camera.getInvtransformMat());
    quad.render();
}
