import {
    Runtime, createRenderState,
    Camera,
    GlTFRenderer,
    color,
    vec3, mul3,
    spherical2zxy, deg2rad,
} from 'lib';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';

/**
 * GlTF model.
 *
 * Demonstrates GlTF models rendering.
 * Parses binary (of JSON) files, loads external content (if such exists), creates primitives and textures.
 */
export type DESCRIPTION = never;

interface ModelInfo {
    readonly name: string;
    readonly path: string;
}

const MODELS: ReadonlyArray<ModelInfo> = [
    { name: 'Box Vertex Colors', path: 'BoxVertexColors.glb' },
    { name: 'Box Interleaved', path: 'BoxInterleaved.gltf' },
    { name: 'Box Textured', path: 'BoxTextured.gltf' },
    { name: 'Box With Spaces', path: 'BoxWithSpaces/Box With Spaces.gltf' },
    { name: 'Cube', path: 'Cube/Cube.gltf' },
];

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime({ element: container });
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const camera = new Camera();
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

    const renderer = new GlTFRenderer({ runtime });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });

    runtime.frameRequested().on(() => {
        runtime.clearBuffer('color');

        renderer.setProjMat(camera.getProjMat());
        renderer.setViewMat(camera.getViewMat());

        renderer.render();
    });

    const selectedModelName = observable(MODELS[0].name);
    selectedModelName.on((selected) => {
        const model = MODELS.find(({ name }) => name === selected)!;
        renderer.setData({ url: `/static/gltf-models/${model.path}` }).then(
            () => {
                runtime.requestFrameRender();
            },
            console.error,
        );
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -50, max: +50 },
        { label: 'model', options: MODELS.map((info) => info.name), selection: selectedModelName },
    ]);
}
