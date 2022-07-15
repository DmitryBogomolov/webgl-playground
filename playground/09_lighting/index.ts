import {
    Runtime,
} from 'lib';
import { makePrimitive } from './primitive';

/**
 * Lighting.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);

runtime.onRender((_delta) => {
    primitive.render();
});
