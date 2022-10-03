import {
    Runtime,
    Primitive,
    TextureCube,
    Camera,
    vec3,
    deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeQuad } from './primitive';
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
    const quad = makeQuad(runtime);
    const texture = makeTexture(runtime);
    const camera = new Camera();

    const cameraLon = observable(0);
    const cameraLat = observable(0);
    const cameraPos = computed(([cameraLon, cameraLat]) => {
        const lon = deg2rad(cameraLon);
        const lat = deg2rad(cameraLat);
        return vec3(
            Math.cos(lat) * Math.sin(lon),
            Math.sin(lat),
            Math.cos(lat) * Math.cos(lon),
        );
    }, [cameraLon, cameraLat]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    camera.changed().on(() => runtime.requestFrameRender());
    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, camera, quad, texture);
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -80, max: +80 },
    ]);
}

function renderFrame(runtime: Runtime, camera: Camera, primitive: Primitive, texture: TextureCube): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);
    primitive.program().setUniform('u_texture', 4);
    primitive.program().setUniform('u_view_proj_inv', camera.getInvtransformMat());
    primitive.render();
}
