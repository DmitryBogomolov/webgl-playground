import {
    Runtime,
} from 'lib';

/**
 * Texts.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);

    runtime.frameRendered().on(() => {

    });
}
