import {
    Runtime,
    color,
    vec3, ZERO3, YUNIT3, mul3,
    mat4, perspective4x4, lookAt4x4, mul4x4, apply4x4, orthographic4x4, identity4x4,
    yrotation4x4, translation4x4, inverse4x4,
    deg2rad,
    clone4x4,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makePrimitive, makeWireframe } from './primitive';
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
const wireframe = makeWireframe(runtime);
const fillTexture = makeFillTexture(runtime);
const mappingTexture = makeMappingTexture(runtime, () => {
    runtime.requestRender();
});

const rotation = observable(0);
const position = observable(0);
const planarLon = observable(0);
const planarLat = observable(0);
const planarWidth = observable(1);
const planarHeight = observable(1);

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

const _planarView = mat4();
const planarView = computed(([planarLon, planarLat]) => {
    const lon = deg2rad(planarLon);
    const lat = deg2rad(planarLat);
    const dir = vec3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon),
    );
    lookAt4x4({
        eye: mul3(dir, 4),
        center: ZERO3,
        up: YUNIT3,
    }, _planarView);
    return _planarView;
}, [planarLon, planarLat]);

const _planarProj = mat4();
const planarProj = computed(([planarWidth, planarHeight]) => {
    orthographic4x4({
        left: -planarWidth / 2,
        right: +planarWidth / 2,
        bottom: -planarHeight / 2,
        top: +planarHeight / 2,
        zNear: 0.01,
        zFar: 100,
    }, _planarProj);
    return _planarProj;
}, [planarWidth, planarHeight]);

const _planarMat = mat4();
const planarMat = computed(([planarView, planarProj]) => {
    //mul4x4(planarProj, planarView, _planarMat);
    clone4x4(planarView, _planarMat);
    //inverse4x4(_planarMat, _planarMat);
    return _planarMat;
}, [planarView, planarProj]);

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

[rotation, position, planarLon, planarLat, planarWidth, planarHeight]
    .forEach((item) => item.on(() => runtime.requestRender()));

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    {
        runtime.setDepthTest(true);
        const program = primitive.program();
        fillTexture.setUnit(4);
        mappingTexture.setUnit(5);
        program.setUniform('u_proj', proj());
        program.setUniform('u_view', view());
        program.setUniform('u_model', model());
        program.setUniform('u_texture', 4);
        program.setUniform('u_planar_texture', 5);
        program.setUniform('u_planar_mat', planarMat());
        primitive.render();
    }
    {
        runtime.setDepthTest(false);
        const program = wireframe.program();
        program.setUniform('u_proj', proj());
        program.setUniform('u_view', view());
        program.setUniform('u_model', planarMat());
        wireframe.render();
    }
});

createControls(container, [
    { label: 'rotation', min: -180, max: +180, value: rotation },
    { label: 'position', min: -5, max: +5, step: 0.5, value: position },
    { label: 'planar lon', min: -180, max: +180, value: planarLon },
    { label: 'planar lat', min: -90, max: +90, value: planarLat },
    { label: 'planar width', min: 0.1, max: 2, step: 0.1, value: planarWidth },
    { label: 'planar height', min: 0.1, max: 2, step: 0.1, value: planarHeight },
]);
