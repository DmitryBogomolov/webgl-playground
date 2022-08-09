import {
    Runtime,
    Program, UniformValue,
    vec2, ZERO2,
    vec3, ZERO3, YUNIT3, neg3, mul3,
    mat4, perspective4x4, lookAt4x4, identity4x4,
    apply4x4, yrotation4x4, translation4x4, mul4x4, inversetranspose4x4,
    color,
    deg2rad,
} from 'lib';
import { makePrimitive, makeDirectionalProgram, makePointProgram, makeSpotProgram } from './primitive';
import { ControlsPanel } from './test-controls/controls-panel';

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
const primitive = makePrimitive(runtime, 8, vec3(3.2, 2, 2.4));

let lightDirection = ZERO3;
let lightPosition = ZERO3;
let lightLimit = ZERO2;


let rotation = 0;
let position = 0;
let lightLon = 45;
let lightLat = 45;
let lightDistance = 5;
let lightLimitPoint = 5;
let lightLimitRange = 10;

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
    makeModelViewProjection();

    runtime.clearBuffer('color|depth');

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

new ControlsPanel(container)
    .addRangeControl({
        label: 'rotation', min: -180, max: +180, value: rotation,
        valueChanged: (value) => {
            rotation = value;
            updateModel();
        },
    })
    .addRangeControl({
        label: 'position', min: -5, max: +5, value: position,
        valueChanged: (value) => {
            position = value;
            updateModel();
        },
    })
    .addRangeControl({
        label: 'light lon', value: lightLon, min: -180, max: +180,
        valueChanged: (value) => {
            lightLon = value;
            updateLight();
        },
    })
    .addRangeControl({
        label: 'light lat', value: lightLat, min: -90, max: +90,
        valueChanged: (value) => {
            lightLat = value;
            updateLight();
        },
    })
    .addRangeControl({
        label: 'light dist', value: lightDistance, min: 2, max: 10,
        valueChanged: (value) => {
            lightDistance = value;
            updateLight();
        },
    })
    .addRangeControl({
        label: 'limit point', value: lightLimitPoint, min: 0, max: 30,
        valueChanged: (value) => {
            lightLimitPoint = value;
            updateLightLimit();
        },
    })
    .addRangeControl({
        label: 'limit range', value: lightLimitRange, min: 0, max: 20,
        valueChanged: (value) => {
            lightLimitRange = value;
            updateLightLimit();
        },
    });

runtime.onSizeChanged(() => {
    const { x, y } = runtime.canvasSize();
    perspective4x4({
        aspect: x / y,
        yFov: Math.PI / 4,
        zNear: 0.01,
        zFar: 100,
    }, proj);
});

function updateModel(): void {
    identity4x4(model);
    apply4x4(model, yrotation4x4, deg2rad(rotation));
    apply4x4(model, translation4x4, vec3(position, 0, 0));
    inversetranspose4x4(model, modelInvTrs);
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
