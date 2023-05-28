import type { } from 'lib';
import {
    Runtime, createRenderState,
    color,
    GlbRenderer,
} from 'lib';

/**
 * Glb model.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const MODEL_URL = 'https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/BoxVertexColors/glTF-Binary/BoxVertexColors.glb';

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    const renderer = new GlbRenderer(runtime);
    renderer.setData({ url: MODEL_URL }).then(
        () => {
            runtime.requestFrameRender();
        },
        console.error,
    ),

    runtime.frameRendered().on(() => {
        runtime.clearBuffer('color');

        runtime.requestFrameRender();
    });
}
