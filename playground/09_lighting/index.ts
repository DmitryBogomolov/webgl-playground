import {
    Runtime,
    Vec2,
    vec3, ZERO3, YUNIT3, neg3, mul3,
    mat4, perspective4x4, lookAt4x4, identity4x4,
    apply4x4, yrotation4x4, translation4x4, mul4x4, inverse4x4, transpose4x4,
    color,
    memoize,
    BUFFER_MASK,
    EventEmitter,
    deg2rad,
} from 'lib';
import { makePrimitive, makeDirectionalProgram, makePointProgram } from './primitive';
import { createControls } from './controls';

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
const directionalProgram = makeDirectionalProgram(runtime);
const pointProgram = makePointProgram(runtime);
const primitive = makePrimitive(runtime, 8, vec3(1.6, 1, 1.2));

let rotation = 0;
let position = 0;
let lightLon = 45;
let lightLat = 45;

const rotationChanged = new EventEmitter<number>();
const positionChanged = new EventEmitter<number>();
const lightLonChanged = new EventEmitter<number>();
const lightLatChanged = new EventEmitter<number>();

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
let lightDir = ZERO3;
let lightPos = ZERO3;

runtime.onRender((_delta) => {
    updateProjection(runtime.canvasSize());
    updateModelViewProjection();

    runtime.clearBuffer(BUFFER_MASK.COLOR | BUFFER_MASK.DEPTH);

    {
        const program = directionalProgram;
        program.setUniform('u_offset', -0.3);
        program.setUniform('u_model_view_proj', viewProj);
        program.setUniform('u_model_inv_trs', modelInvTrs);
        program.setUniform('u_color', clr);
        program.setUniform('u_light_dir', lightDir);
        primitive.setProgram(program);
        primitive.render();
    }
    {
        const program = pointProgram;
        program.setUniform('u_offset', +0.3);
        program.setUniform('u_model_view_proj', viewProj);
        program.setUniform('u_model', model);
        program.setUniform('u_model_inv_trs', modelInvTrs);
        program.setUniform('u_color', clr);
        program.setUniform('u_light_position', lightPos);
        primitive.setProgram(program);
        primitive.render();
    }
});

updateModel();
updateLight();

createControls([
    { name: 'rotation', value: rotation, min: -180, max: +180, emitter: rotationChanged },
    { name: 'position', value: position, min: -5, max: +5, emitter: positionChanged },
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
    lightDir = neg3(dir);
    lightPos = mul3(dir, 5);
    runtime.requestRender();
}

function updateModelViewProjection(): void {
    identity4x4(viewProj);
    mul4x4(model, viewProj, viewProj);
    mul4x4(view, viewProj, viewProj);
    mul4x4(proj, viewProj, viewProj);
}
