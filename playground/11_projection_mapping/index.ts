import {
    Runtime,
    color,
    vec3, ZERO3, YUNIT3, mul3,
    mat4, perspective4x4, lookAt4x4, orthographic4x4, apply4x4,
    mul4x4, identity4x4, yrotation4x4, translation4x4, inverse4x4,
    deg2rad,
} from 'lib';
import { Observable, observable, computed } from 'util/observable';
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

const wireframeColor = color(0.1, 0.1, 0.1);

const rotation = observable(0);
const position = observable(0);
const projectionLon = observable(0);
const projectionLat = observable(0);
const projectionWidth = observable(1);
const projectionHeight = observable(1);
const projectionFOV = observable(45);
const isPerpsectiveProjection = observable(false);
const isWireframeShown = observable(true);

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

const _projectionView = mat4();
const projectionView = computed(([planarLon, planarLat]) => {
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
    }, _projectionView);
    return _projectionView;
}, [projectionLon, projectionLat]);

const _projectionProj = mat4();
const projectionProj = computed(([projectionWidth, projectionHeight, projectionFOV, isPerpsectiveProjection]) => {
    if (isPerpsectiveProjection) {
        perspective4x4({
            yFov: deg2rad(projectionFOV),
            aspect: projectionWidth / projectionHeight,
            zNear: 0.01,
            zFar: 100,
        }, _projectionProj);
    } else {
        orthographic4x4({
            left: -projectionWidth / 2,
            right: +projectionWidth / 2,
            bottom: -projectionHeight / 2,
            top: +projectionHeight / 2,
            zNear: 0.01,
            zFar: 100,
        }, _projectionProj);
    }
    return _projectionProj;
}, [
    projectionWidth, projectionHeight, projectionFOV, isPerpsectiveProjection,
] as [Observable<number>, Observable<number>, Observable<number>, Observable<boolean>]);

const _projectionMat = mat4();
const projectionMat = computed(([projectionView, projectionProj]) => {
    mul4x4(projectionProj, projectionView, _projectionMat);
    return _projectionMat;
}, [projectionView, projectionProj]);

const _wireframeMat = mat4();
const wireframeMat = computed(([planarMat]) => {
    inverse4x4(planarMat, _wireframeMat);
    return _wireframeMat;
}, [projectionMat]);

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

[
    rotation, position,
    projectionLon, projectionLat, projectionWidth, projectionHeight, projectionFOV, isPerpsectiveProjection,
    isWireframeShown,
].forEach((item) => item.on(() => runtime.requestRender()));

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
        program.setUniform('u_planar_mat', projectionMat());
        primitive.render();
    }
    if (isWireframeShown()) {
        runtime.setDepthTest(false);
        const program = wireframe.program();
        program.setUniform('u_proj', proj());
        program.setUniform('u_view', view());
        program.setUniform('u_model', wireframeMat());
        program.setUniform('u_color', wireframeColor);
        wireframe.render();
    }
});

createControls(container, [
    { label: 'rotation', min: -180, max: +180, value: rotation },
    { label: 'position', min: -5, max: +5, step: 0.5, value: position },
    { label: 'proj lon', min: -180, max: +180, value: projectionLon },
    { label: 'proj lat', min: -90, max: +90, value: projectionLat },
    { label: 'proj width', min: 0.1, max: 2, step: 0.1, value: projectionWidth },
    { label: 'proj height', min: 0.1, max: 2, step: 0.1, value: projectionHeight },
    { label: 'proj FOV', min: 1, max: 90, value: projectionFOV },
    { label: 'perspective', checked: isPerpsectiveProjection },
    { label: 'wifeframe', checked: isWireframeShown },
]);
