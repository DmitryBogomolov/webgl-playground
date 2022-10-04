import {
    Runtime,
    Camera,
} from 'lib';

/**
 * Picking.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    const camera = new Camera();

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, camera);
    });
}

function renderFrame(
    runtime: Runtime, camera: Camera,
): void {
    runtime.clearBuffer('color|depth');

}
