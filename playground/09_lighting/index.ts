import {
    Runtime,
    Program, UniformValue,
    Vec2, vec2, ZERO2,
    vec3, ZERO3, YUNIT3, neg3, mul3,
    mat4, perspective4x4, lookAt4x4, identity4x4,
    apply4x4, yrotation4x4, translation4x4, mul4x4, inverse4x4, transpose4x4,
    color,
    memoize,
    BUFFER_MASK,
    EventEmitter,
    deg2rad,
} from 'lib';
import { makePrimitive, makeDirectionalProgram, makePointProgram, makeSpotProgram } from './primitive';
import { createControls } from './controls';

/**
 * Lighting.
 *
 * Different basic lighting techniques.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.4, 0.4, 0.4));
runtime.setDepthTest(true);
const directionalProgram = makeDirectionalProgram(runtime);
const pointProgram = makePointProgram(runtime);
const spotProgram = makeSpotProgram(runtime);
const primitive = makePrimitive(runtime, 8, vec3(1.6, 1, 1.2));

let lightDirection = ZERO3;
let lightPosition = ZERO3;
let lightDistance = 5;
let lightLimit = ZERO2;

let rotation = 0;
let position = 0;
let lightLon = 45;
let lightLat = 45;
let lightLimitPoint = 5;
let lightLimitRange = 10;

const rotationChanged = new EventEmitter<number>();
const positionChanged = new EventEmitter<number>();
const lightLonChanged = new EventEmitter<number>();
const lightLatChanged = new EventEmitter<number>();
const lightDistChanged = new EventEmitter<number>();
const lightLimitPointChanged = new EventEmitter<number>();
const lightLimitRangeChanged = new EventEmitter<number>();

rotationChanged.on((value) => {
    rotation = value;
    updateModel();
});
positionChanged.on((value) => {
    position = value;
    updateModel();
});
lightLonChanged.on((value) => {
    lightLon = value;
    updateLight();
});
lightLatChanged.on((value) => {
    lightLat = value;
    updateLight();
});
lightDistChanged.on((value) => {
    lightDistance = value;
    updateLight();
});
lightLimitPointChanged.on((value) => {
    lightLimitPoint = value;
    updateLightLimit();
});
lightLimitRangeChanged.on((value) => {
    lightLimitRange = value;
    updateLightLimit();
});

const proj = mat4();
const view = lookAt4x4({
    eye: vec3(0, 3, 5),
    center: ZERO3,
    up: YUNIT3,
});
const model = mat4();
const viewProj = mat4();
const modelInvTrs = mat4();
const clr = color(0.2, 0.6, 0.1);

runtime.onRender((_delta) => {
    updateProjection(runtime.canvasSize());
    makeModelViewProjection();

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);

    renderPrimitive(directionalProgram, -0.5, {
        'u_light_direction': lightDirection,
    });
    renderPrimitive(pointProgram, 0, {
        'u_model': model,
        'u_light_position': lightPosition,
    });
    renderPrimitive(spotProgram, +0.5, {
        'u_model': model,
        'u_light_position': lightPosition,
        'u_light_direction': lightDirection,
        'u_light_limit': lightLimit,
    });
});

function renderPrimitive(program: Program, offset: number, uniforms: Record<string, UniformValue>): void {
    program.setUniform('u_offset', offset);
    program.setUniform('u_model_view_proj', viewProj);
    program.setUniform('u_model_inv_trs', modelInvTrs);
    program.setUniform('u_color', clr);
    for (const [name, value] of Object.entries(uniforms)) {
        program.setUniform(name, value);
    }
    primitive.setProgram(program);
    primitive.render();
}

updateModel();
updateLight();
updateLightLimit();

createControls([
    { name: 'rotation', value: rotation, min: -180, max: +180, emitter: rotationChanged },
    { name: 'position', value: position, min: -5, max: +5, emitter: positionChanged },
    { name: 'light lon', value: lightLon, min: -180, max: +180, emitter: lightLonChanged },
    { name: 'light lat', value: lightLat, min: -90, max: +90, emitter: lightLatChanged },
    { name: 'light dist', value: lightDistance, min: 2, max: 10, emitter: lightDistChanged },
    { name: 'limit point', value: lightLimitPoint, min: 0, max: 30, emitter: lightLimitPointChanged },
    { name: 'limit range', value: lightLimitRange, min: 0, max: 20, emitter: lightLimitRangeChanged },
]);

const updateProjection = memoize((size: Vec2): void => {
    perspective4x4({
        aspect: size.x / size.y,
        yFov: Math.PI / 4,
        zNear: 0.01,
        zFar: 100,
    }, proj);
});

function updateModel(): void {
    identity4x4(model);
    apply4x4(model, yrotation4x4, deg2rad(rotation));
    apply4x4(model, translation4x4, vec3(position, 0, 0));
    inverse4x4(model, modelInvTrs);
    transpose4x4(modelInvTrs, modelInvTrs);
    runtime.requestRender();
}

function updateLight(): void {
    const lon = deg2rad(lightLon);
    const lat = deg2rad(lightLat);
    const dir = vec3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon),
    );
    lightDirection = neg3(dir);
    lightPosition = mul3(dir, lightDistance);
    runtime.requestRender();
}

function updateLightLimit(): void {
    const point = deg2rad(lightLimitPoint);
    const range = deg2rad(lightLimitRange);
    const p1 = Math.max(point - range / 2, 0);
    const p2 = point + range / 2;
    lightLimit = vec2(Math.cos(p2), Math.cos(p1));
    runtime.requestRender();
}

function makeModelViewProjection(): void {
    identity4x4(viewProj);
    mul4x4(model, viewProj, viewProj);
    mul4x4(view, viewProj, viewProj);
    mul4x4(proj, viewProj, viewProj);
}
