import {
    Runtime,
    BUFFER_MASK,
    memoize,
    color,
    Vec2,
    ZERO3, XUNIT3, YUNIT3, ZUNIT3, vec3,
    mat4, mul4x4, identity4x4, scaling4x4, rotation4x4, perspective4x4, lookAt4x4, targetTo4x4, apply4x4,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeFigureRenderer } from './figure';

/**
 * 3D Transformations.
 *
 * Basic 3D transformations, relative transformations, camera and perspective projection.
 */
export type DESCRIPTION = never;

const CAMERA_DISTANCE = 13;
const PI2 = Math.PI * 2;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.4, 0.4, 0.4));
runtime.setDepthTest(true);
const figure1 = makeFigureRenderer(
    makePrimitive(runtime),
    2, vec3(1, 8, 0), 3, +0.11 * PI2 / 1000,
);
const figure2 = makeFigureRenderer(
    makePrimitive(runtime),
    0.9, vec3(1, 0, 0), 4, -0.15 * PI2 / 1000,
);
const figure3 = makeFigureRenderer(
    makePrimitive(runtime),
    0.7, vec3(0, 0, 1), 5, +0.19 * PI2 / 1000,
);

const proj = mat4();
const view = mat4();
const viewProj = mat4();
const unit = identity4x4();

let cameraAngle = 0;
const cameraSpeed = 0.1 * PI2 / 1000;
let worldAngle = 0;
const worldSpeed = 0.2 * PI2 / 1000;

runtime.onRender((delta) => {
    cameraAngle = (cameraAngle + delta * cameraSpeed) % PI2;
    worldAngle = (worldAngle + delta * worldSpeed) % PI2;

    updateProjection(runtime.canvasSize());
    updateView(0);
    identity4x4(viewProj);
    mul4x4(view, viewProj, viewProj);
    mul4x4(proj, viewProj, viewProj);
    figure1.update(viewProj, unit, delta);
    figure2.update(viewProj, figure1.model(), delta);
    figure3.update(viewProj, figure1.model(), delta);

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    figure1.render();
    figure2.render();
    figure3.render();
    runtime.requestRender();
});

const updateProjection = memoize(({ x, y }: Vec2): void => {
    perspective4x4({
        aspect: x / y,
        yFov: Math.PI / 4,
        zNear: 0.001,
        zFar: 100,
    }, proj);
});

function updateView(angle: number): void {
    const x = CAMERA_DISTANCE * Math.sin(angle);
    const z = CAMERA_DISTANCE * Math.cos(angle);
    lookAt4x4({
        eye: { x, y: 3, z },
        center: ZERO3,
        up: YUNIT3,
    }, view);
}
