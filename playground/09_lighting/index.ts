import {
    Runtime,
    Vec2,
    vec3,
    ZERO3,
    YUNIT3,
    mat4,
    color,
    perspective4x4,
    lookAt4x4,
    identity4x4,
    mul4x4,
    memoize,
    BUFFER_MASK,
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
runtime.setClearColor(color(0.4, 0.4, 0.4));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime, 4, vec3(1, 1, 1));

const proj = mat4();
const view = mat4();
const world = mat4();
const worldViewProj = mat4();
const clr = color(0.2, 0.6, 0.1);

runtime.onRender((_delta) => {
    updateProjection(runtime.canvasSize());
    updateView();
    identity4x4(world);
    updateWorldViewProjection();

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    primitive.program().setUniform('u_world_view_proj', worldViewProj, true);
    primitive.program().setUniform('u_color', clr);
    primitive.render();
    // runtime.requestRender();
});

const updateProjection = memoize((size: Vec2): void => {
    perspective4x4({
        aspect: size.x / size.y,
        yFov: Math.PI / 4,
        zNear: 0.01,
        zFar: 100,
    }, proj);
});

function updateView(): void {
    lookAt4x4({
        eye: vec3(0, 0, 5),
        center: ZERO3,
        up: YUNIT3,
    }, view);
}

function updateWorldViewProjection(): void {
    identity4x4(worldViewProj);
    mul4x4(world, worldViewProj, worldViewProj);
    mul4x4(view, worldViewProj, worldViewProj);
    mul4x4(proj, worldViewProj, worldViewProj);
}
