import {
    Runtime,
    Program, UniformValue,
    vec2,
    vec3, ZERO3, YUNIT3, neg3, mul3,
    mat4, perspective4x4, lookAt4x4, identity4x4,
    apply4x4, yrotation4x4, translation4x4, mul4x4, inversetranspose4x4,
    color,
    deg2rad,
} from 'lib';
import { makePrimitive, makeDirectionalProgram, makePointProgram, makeSpotProgram } from './primitive';
import { ControlsPanel } from './test-controls/controls-panel';
import { observable, computed } from './test-controls/observable';

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
const clr = color(0.2, 0.6, 0.1);

const rotation = observable(0);
const position = observable(0);
const lightLon = observable(45);
const lightLat = observable(45);
const lightDistance = observable(5);
const lightLimitPoint = observable(5);
const lightLimitRange = observable(10);

const proj = observable(
    identity4x4(),
);
const view = observable(
    lookAt4x4({
        eye: vec3(0, 3, 5),
        center: ZERO3,
        up: YUNIT3,
    }),
);

const _model = mat4();
const model = computed(
    ([rotation, position]) => {
        const mat = _model;
        identity4x4(mat);
        apply4x4(mat, yrotation4x4, deg2rad(rotation));
        apply4x4(mat, translation4x4, vec3(position, 0, 0));
        return mat;
    },
    [rotation, position],
);

const _modelViewProj = mat4();
const modelViewProj = computed(
    ([model, view, proj]) => {
        const mat = _modelViewProj;
        identity4x4(mat);
        mul4x4(model, mat, mat);
        mul4x4(view, mat, mat);
        mul4x4(proj, mat, mat);
        return mat;
    },
    [model, view, proj],
);

const _modelInvTrs = mat4();
const modelInvTrs = computed(
    ([model]) => {
        const mat = _modelInvTrs;
        inversetranspose4x4(model, mat);
        return mat;
    },
    [model],
);

const lightDirection = computed(
    ([lightLon, lightLat]) => {
        const lon = deg2rad(lightLon);
        const lat = deg2rad(lightLat);
        const dir = vec3(
            Math.cos(lat) * Math.sin(lon),
            Math.sin(lat),
            Math.cos(lat) * Math.cos(lon),
        );
        return neg3(dir);
    },
    [lightLon, lightLat],
);

const lightPosition = computed(
    ([lightDirection, lightDistance]) => {
        return mul3(lightDirection, -lightDistance);
    },
    [lightDirection, lightDistance],
);

const lightLimit = computed(
    ([lightLimitPoint, lightLimitRange]) => {
        const point = deg2rad(lightLimitPoint);
        const range = deg2rad(lightLimitRange);
        const p1 = Math.max(point - range / 2, 0);
        const p2 = point + range / 2;
        return vec2(Math.cos(p2), Math.cos(p1));
    },
    [lightLimitPoint, lightLimitRange],
);

const rerender = (): void => runtime.requestRender();
[proj, view, model, modelInvTrs, lightDirection, lightPosition, lightLimit]
    .forEach((item) => item.on(rerender));

const _proj = mat4();
runtime.onSizeChanged(() => {
    const { x, y } = runtime.canvasSize();
    perspective4x4({
        aspect: x / y,
        yFov: Math.PI / 4,
        zNear: 0.01,
        zFar: 100,
    }, _proj);
    proj(_proj);
});

runtime.onRender((_delta) => {
    runtime.clearBuffer('color|depth');

    renderPrimitive(directionalProgram, -0.5, {
        'u_light_direction': lightDirection(),
    });
    renderPrimitive(pointProgram, 0, {
        'u_model': model(),
        'u_light_position': lightPosition(),
    });
    renderPrimitive(spotProgram, +0.5, {
        'u_model': model(),
        'u_light_position': lightPosition(),
        'u_light_direction': lightDirection(),
        'u_light_limit': lightLimit(),
    });
});

function renderPrimitive(program: Program, offset: number, uniforms: Record<string, UniformValue>): void {
    program.setUniform('u_offset', offset);
    program.setUniform('u_model_view_proj', modelViewProj());
    program.setUniform('u_model_inv_trs', modelInvTrs());
    program.setUniform('u_color', clr);
    for (const [name, value] of Object.entries(uniforms)) {
        program.setUniform(name, value);
    }
    primitive.setProgram(program);
    primitive.render();
}

new ControlsPanel(container)
    .addRangeControl({
        label: 'rotation', min: -180, max: +180, value: rotation(), valueChanged: rotation,
    })
    .addRangeControl({
        label: 'position', min: -5, max: +5, value: position(), valueChanged: position,
    })
    .addRangeControl({
        label: 'light lon', min: -180, max: +180, value: lightLon(), valueChanged: lightLon,
    })
    .addRangeControl({
        label: 'light lat', min: -90, max: +90, value: lightLat(), valueChanged: lightLat,
    })
    .addRangeControl({
        label: 'light dist', min: 2, max: 10, value: lightDistance(), valueChanged: lightDistance,
    })
    .addRangeControl({
        label: 'limit point', min: 0, max: 30, value: lightLimitPoint(), valueChanged: lightLimitPoint,
    })
    .addRangeControl({
        label: 'limit range', min: 0, max: 20, value: lightLimitRange(), valueChanged: lightLimitRange,
    });
