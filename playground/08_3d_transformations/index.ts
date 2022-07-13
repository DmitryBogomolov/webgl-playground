import {
    Runtime,
    BUFFER_MASK,
    color,
    memoize,
    Vec2,
    ZERO3, XUNIT3, YUNIT3, ZUNIT3, vec3,
    mat4,
    mul4x4, identity4x4, apply4x4, scaling4x4, rotation4x4,
    perspective4x4, lookAt4x4,
} from 'lib';
import { makePrimitive } from './primitive';

/**
 * 3D Transformations.
 *
 * Basic 3D transformations, relative transformations, camera and perspective projection.
 */
export type DESCRIPTION = never;

const CAMERA_DISTANCE = 3;
const MODEL_SCALE = 1.2;
const PI2 = Math.PI * 2;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.4, 0.4, 0.4));
runtime.setDepthTest(true);
runtime.setCulling(true);
const primitive = makePrimitive(runtime);

const projection = mat4();
const view = mat4();
const transform = mat4();

let cameraAngle = 0;
const cameraSpeed = 0.1 * PI2 / 1000;
let worldAngle = 0;
const worldSpeed = 0.2 * PI2 / 1000;

runtime.onRender((delta) => {
    cameraAngle = (cameraAngle + delta * cameraSpeed) % PI2;
    worldAngle = (worldAngle + delta * worldSpeed) % PI2;

    updateProjection(runtime.canvasSize());
    updateView(cameraAngle);
    updateWorld(worldAngle);
    mul4x4(view, transform, transform);
    mul4x4(projection, transform, transform);

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    primitive.program().setUniform('u_transform', transform, true);
    primitive.render();
    runtime.requestRender();
});

const updateProjection = memoize(({ x, y }: Vec2): void => {
    perspective4x4({
        aspect: x / y,
        yFov: Math.PI / 4,
        zNear: 0.001,
        zFar: 100,
    }, projection);
});

function updateView(angle: number): void {
    const x = CAMERA_DISTANCE * Math.sin(angle);
    const z = CAMERA_DISTANCE * Math.cos(angle);
    lookAt4x4({
        eye: { x, y: 0, z },
        center: ZERO3,
        up: YUNIT3,
    }, view);
}

function updateWorld(angle: number): void {
    identity4x4(transform);
    apply4x4(transform, scaling4x4, vec3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE));
    apply4x4(transform, rotation4x4, ZUNIT3, angle);
    apply4x4(transform, rotation4x4, XUNIT3, angle);
}
