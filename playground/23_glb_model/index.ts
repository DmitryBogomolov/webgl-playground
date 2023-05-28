import type {  } from 'lib';
import { Runtime, createRenderState, color } from 'lib';

/**
 * Glb model.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));

    runtime.frameRendered().on(() => {
        runtime.clearBuffer('color');

        runtime.requestFrameRender();
    });
}
