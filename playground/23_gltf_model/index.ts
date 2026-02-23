import {
    createRenderState,
    ViewProj,
    GlTFRenderer,
    color,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { observable, bind } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { trackBall } from 'playground-utils/track-ball';

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

    const vp = new ViewProj();

    const renderer = new GlTFRenderer({ runtime });

    const cancelRender = renderOnChange(runtime, [vp, renderer]);

    runtime.renderSizeChanged().on(() => {
        vp.setViewportSize(runtime.renderSize());
    });
    runtime.frameRequested().on(() => {
        runtime.clearBuffer('color');
        renderer.setProjMat(vp.getProjMat());
        renderer.setViewMat(vp.getViewMat());
        renderer.render();
    });
    const disposeTrackBall = trackBall({
        element: runtime.canvas(),
        initial: { x: 0, y: 1, z: 2 },
        distance: { fixed: 5 },
        callback: (v) => {
            vp.setEyePos(v);
        },
    });

    const selectedModelName = observable(MODELS[0].name);
    bind(selectedModelName, (targetName) => {
        const model = MODELS.find(({ name }) => name === targetName)!;
        renderer.setData({ url: `/static/gltf-models/${model.path}` }).catch(console.error);
    });

    const controlRoot = createControls(container, [
        { label: 'model', options: MODELS.map((info) => info.name), selection: selectedModelName },
    ]);

    return () => {
        disposeAll([
            cancelRender, controlRoot, disposeTrackBall,
            renderer, runtime,
        ]);
    };
}
