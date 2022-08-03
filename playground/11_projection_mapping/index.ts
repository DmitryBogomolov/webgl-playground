import {
    Runtime,
    color,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeTexture } from './texture';

/**
 * Projection mapping.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime, () => {
    runtime.requestRender();
});
texture.setUnit(4);
texture.setParameters({
    mag_filter: 'nearest',
    min_filter: 'nearest',
});

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    primitive.render();
});
