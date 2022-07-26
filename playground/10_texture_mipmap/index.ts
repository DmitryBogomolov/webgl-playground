import {
    Runtime,
    Program,
} from 'lib';

/**
 * Texture mipmap.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);

runtime.onRender(() => {

});
