import {
    Runtime,
    color,
} from 'lib';

/**
 * 3D Transformations.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.4, 0.4, 0.4));

runtime.onRender((delta) => {
    runtime.clearColorBuffer();
    runtime.requestRender();
});
