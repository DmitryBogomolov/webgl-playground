import {
    Runtime, createRenderState,
    Camera,
    GlbRenderer,
    color,
    vec3, mul3,
    spherical2zxy, deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';

/**
 * Glb model.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxVertexColors/glTF-Binary/BoxVertexColors.glb';

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const camera = new Camera();
    camera.setViewportSize
    camera.setEyePos(vec3(0, 3, 5));

    camera.changed().on(() => runtime.requestFrameRender());

    const cameraLon = observable(0);
    const cameraLat = observable(30);
    const cameraPos = computed(([cameraLon, cameraLat]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, 5);
    }, [cameraLon, cameraLat]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    const renderer = new GlbRenderer(runtime);
    renderer.setData({ url: MODEL_URL }).then(
        () => {
            runtime.requestFrameRender();
        },
        console.error,
    );

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });

    runtime.frameRequested().on(() => {
        runtime.clearBuffer('color');

        renderer.setViewProj(camera.getTransformMat());

        renderer.render();
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -50, max: +50 },
    ]);
}
