import {
    Runtime,
    color,
    vec3, ZERO3, YUNIT3,
    mat4, perspective4x4, lookAt4x4, apply4x4, orthographic4x4, identity4x4,
    yrotation4x4, translation4x4,
    deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makePrimitive } from './primitive';
import { makeFillTexture, makeMappingTexture } from './texture';

/**
 * Projection mapping.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime);
const fillTexture = makeFillTexture(runtime);
const mappingTexture = makeMappingTexture(runtime, () => {
    runtime.requestRender();
});

const rotation = observable(0);
const position = observable(0);

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

const proj = observable(
    mat4(),
);
const view = observable(
    lookAt4x4({
        eye: vec3(0, 0, 5),
        center: ZERO3,
        up: YUNIT3,
    }),
);

const planarMat = lookAt4x4({
    eye: vec3(0, 0, 4),
    center: ZERO3,
    up: YUNIT3,
});
const k = 1;
const dk = 0.5;
apply4x4(planarMat, orthographic4x4, {
    left: -dk * k,
    right: +dk * k,
    bottom: -dk,
    top: +dk,
    zNear: 0.01,
    zFar: 100,
});

const _proj = mat4();
runtime.onSizeChanged(() => {
    const { x, y } = runtime.canvasSize();
    perspective4x4({
        yFov: Math.PI / 4,
        aspect: x / y,
        zNear: 0.01,
        zFar: 100,
    }, _proj);
    proj(_proj);
});

[rotation, position]
    .forEach((item) => item.on(() => runtime.requestRender()));

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    const program = primitive.program();
    fillTexture.setUnit(4);
    mappingTexture.setUnit(5);
    program.setUniform('u_proj', proj());
    program.setUniform('u_view', view());
    program.setUniform('u_model', model());
    program.setUniform('u_texture', 4);
    program.setUniform('u_planar_texture', 5);
    program.setUniform('u_planar_mat', planarMat);
    primitive.render();
});

createControls(container, [
    { label: 'rotation', min: -180, max: +180, value: rotation },
    { label: 'position', min: -5, max: +5, value: position },
]);
