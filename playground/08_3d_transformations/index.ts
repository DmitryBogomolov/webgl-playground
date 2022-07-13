import {
    Runtime,
    BUFFER_MASK,
    // DEPTH_FUNC,
    color,
    mat4,
    mul4x4,
    identity4x4,
    rotation4x4,
    // orthographic4x4,
    perspective4x4,
    // mul4v3,
    apply4x4,
    // translation4x4,
    lookAt4x4,
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
runtime.setDepthTest(true);
runtime.setCulling(true);
// runtime.setDepthFunc(DEPTH_FUNC.GREATER);
// runtime.setClearDepth(0);
const primitive = makePrimitive(runtime);

const projection = mat4();
// orthographic4x4({ left: -4, right: +4, bottom: -4, top: +4, zNear: 2, zFar: -2 }, projection);
perspective4x4({
    aspect: runtime.canvasSize().x / runtime.canvasSize().y,
    yFov: Math.PI / 4,
    zNear: 0.001,
    zFar: 100,
}, projection);

const view = mat4();
lookAt4x4({
    eye: { x: 0, y: 0, z: 10 },
    center: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
}, view);

const transform = mat4();
identity4x4(transform);

apply4x4(transform, rotation4x4, { x: 0, y: 1, z: 0 }, -Math.PI / 6);
apply4x4(transform, rotation4x4, { x: 1, y: 0, z: 0 }, Math.PI / 6);
//apply4x4(transform, translation4x4, { x: 0, y: 0, z: -10 });

mul4x4(view, transform, transform);
mul4x4(projection, transform, transform);

runtime.onRender((_delta) => {
    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    primitive.program().setUniform('u_transform', transform, true);
    primitive.render();
    //runtime.requestRender();
});
