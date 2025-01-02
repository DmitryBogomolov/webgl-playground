import {
    createRenderState,
    ViewProj,
    GlTFRenderer,
    color,
    vec3,
    spherical2zxy, deg2rad,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
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

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const viewProj = new ViewProj();
    viewProj.setEyePos(vec3(0, 3, 5));

    const renderer = new GlTFRenderer({ runtime });

    const cancelRender = renderOnChange(runtime, [viewProj, renderer]);

    const cameraLon = observable(0);
    const cameraLat = observable(30);
    const cameraPos = computed(([cameraLon, cameraLat]) => {
        return spherical2zxy({
            distance: 5,
            azimuth: deg2rad(cameraLon),
            elevation: deg2rad(cameraLat),
        });
    }, [cameraLon, cameraLat]);
    cameraPos.on((cameraPos) => {
        viewProj.setEyePos(cameraPos);
    });

    const cancelTracking = trackSize(runtime, () => {
        viewProj.setViewportSize(runtime.canvasSize());
    });

    runtime.frameRequested().on(() => {
        runtime.clearBuffer('color');
        renderer.setProjMat(viewProj.getProjMat());
        renderer.setViewMat(viewProj.getViewMat());
        renderer.render();
    });

    const selectedModelName = observable(MODELS[0].name);
    selectedModelName.on((selected) => {
        const model = MODELS.find(({ name }) => name === selected)!;
        renderer.setData({ url: `/static/gltf-models/${model.path}` }).catch(console.error);
    });

    const controlRoot = createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -50, max: +50 },
        { label: 'model', options: MODELS.map((info) => info.name), selection: selectedModelName },
    ]);

    return () => {
        disposeAll([
            cameraLon, cameraLat, cameraPos,
            renderer, runtime, cancelTracking, cancelRender, controlRoot,
        ]);
    };
}
