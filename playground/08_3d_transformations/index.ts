import {
    Runtime,
    BUFFER_MASK,
    color,
    mat4,
    identity4x4,

    rotation4x4,
} from 'lib';
import { makePrimitive } from './primitive';

/**
 * 3D Transformations.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.4, 0.4, 0.4));
const primitive = makePrimitive(runtime);

const transform = mat4();
identity4x4(transform);

rotation4x4({ x: 0, y: 0, z: 0.5 }, Math.PI / 100, transform);

runtime.onRender((_delta) => {
    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    primitive.program().setUniform('u_transform', transform, true);
    primitive.render();
    runtime.requestRender();
});
