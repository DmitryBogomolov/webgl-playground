import {
    Runtime,
    Vec2,
    Vec3, vec3, ZERO3, YUNIT3, norm3, mul3, neg3,
    mat4, perspective4x4, lookAt4x4, identity4x4, mul4x4,
    color,
    memoize,
    BUFFER_MASK,
    EventEmitter,
    deg2rad,
} from 'lib';
import { makePrimitive } from './primitive';
import { createControls } from './controls';

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

let cameraLon = 0;
let cameraLat = 30;
let lightLon = 45;
let lightLat = 45;

const cameraLonChanged = new EventEmitter<number>();
const cameraLatChanged = new EventEmitter<number>();
const lightLonChanged = new EventEmitter<number>();
const lightLatChanged = new EventEmitter<number>();

const proj = mat4();
const view = mat4();
const viewProj = mat4();
const clr = color(0.2, 0.6, 0.1);
let lightDir = ZERO3;

runtime.onRender((_delta) => {
    updateProjection(runtime.canvasSize());
    updateWorldViewProjection();

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);
    primitive.program().setUniform('u_world_view_proj', viewProj, true);
    primitive.program().setUniform('u_color', clr);
    primitive.program().setUniform('u_light_dir', lightDir);
    primitive.render();
});

updateView();
updateLight();

createControls([
    { name: 'camera lon', value: cameraLon, min: -180, max: +180, emitter: cameraLonChanged },
    { name: 'camera lat', value: cameraLat, min: -90, max: +90, emitter: cameraLatChanged },
    { name: 'light lon', value: lightLon, min: -180, max: +180, emitter: lightLonChanged },
    { name: 'light lat', value: lightLat, min: -90, max: +90, emitter: lightLatChanged },
]);

const updateProjection = memoize((size: Vec2): void => {
    perspective4x4({
        aspect: size.x / size.y,
        yFov: Math.PI / 4,
        zNear: 0.01,
        zFar: 100,
    }, proj);
});

function getDirection(lon: number, lat: number): Vec3 {
    const ln = deg2rad(lon);
    const lt = deg2rad(lat);
    return vec3(
        Math.cos(lt) * Math.sin(ln),
        Math.sin(lt),
        Math.cos(lt) * Math.cos(ln),
    );
}

function updateView(): void {
    lookAt4x4({
        eye: mul3(getDirection(cameraLon, cameraLat), CAMERA_DISTANCE),
        center: ZERO3,
        up: YUNIT3,
    }, view);
    runtime.requestRender();
}

function updateLight(): void {
    const dir = getDirection(lightLon, lightLat);
    lightDir = neg3(dir);
    runtime.requestRender();
}

cameraLonChanged.on((value) => {
    cameraLon = value;
    updateView();
});
cameraLatChanged.on((value) => {
    cameraLat = value;
    updateView();
});

lightLonChanged.on((value) => {
    lightLon = value;
    updateLight();
});

lightLatChanged.on((value) => {
    lightLat = value;
    updateLight();
});

function updateWorldViewProjection(): void {
    identity4x4(viewProj);
    mul4x4(world, viewProj, viewProj);
    mul4x4(view, viewProj, viewProj);
    mul4x4(proj, viewProj, viewProj);
}
