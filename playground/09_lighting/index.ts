import {
    Runtime,
    Vec2,
    vec3, ZERO3, YUNIT3, norm3, mul3,
    mat4, perspective4x4, lookAt4x4, identity4x4, mul4x4,
    color,
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

const CAMERA_DISTANCE = 5;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.4, 0.4, 0.4));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime, 8, vec3(1.6, 1, 1.2));

const proj = mat4();
const view = lookAt4x4({
    eye: mul3(norm3(vec3(1, 4, 3)), CAMERA_DISTANCE),
    center: ZERO3,
    up: YUNIT3,
})
const world = mat4();
const worldViewProj = mat4();
const clr = color(0.2, 0.6, 0.1);

runtime.onRender((_delta) => {
    updateProjection(runtime.canvasSize());
    identity4x4(world);
    updateWorldViewProjection();

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    primitive.program().setUniform('u_world_view_proj', worldViewProj, true);
    primitive.program().setUniform('u_color', clr);
    primitive.program().setUniform('u_light_dir', norm3(vec3(-1, -1, -1)));
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

function updateWorldViewProjection(): void {
    identity4x4(worldViewProj);
    mul4x4(world, worldViewProj, worldViewProj);
    mul4x4(view, worldViewProj, worldViewProj);
    mul4x4(proj, worldViewProj, worldViewProj);
}
