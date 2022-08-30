import {
    Runtime,
    Primitive,
    Camera,
    color,
    vec2,
    vec3, mul3,
    mat4, apply4x4, identity4x4, yrotation4x4, translation4x4,
    deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeProgram, makeSphere, makeEllipse, makeCube, makePlane, makeWireframe } from './primitive';
import { makeFillTexture, makeMappingTexture } from './texture';

/**
 * Projection mapping.
 *
 * Shows projection mapping and projection wifeframe.
 */
export type DESCRIPTION = never;

interface PrimitiveData {
    readonly primitive: Primitive;
    readonly offset: number;
}

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);
const program = makeProgram(runtime);
const primitives: ReadonlyArray<PrimitiveData> = [
    { primitive: makeSphere(runtime, program), offset: -1.5 },
    { primitive: makeEllipse(runtime, program), offset: -0.5 },
    { primitive: makeCube(runtime, program), offset: +0.5 },
    { primitive: makePlane(runtime, program), offset: +1.5 },
];
const wireframe = makeWireframe(runtime);
const fillTexture = makeFillTexture(runtime);
const mappingTexture = makeMappingTexture(runtime, () => {
    runtime.requestFrameRender();
});

const wireframeColor = color(0.1, 0.1, 0.1);
const camera = new Camera();
camera.setEyePos(vec3(0, 2, 5));
const projectionCamera = new Camera();

const rotation = observable(0);
const position = observable(0);
const projectionDist = observable(2);
const projectionLon = observable(0);
const projectionLat = observable(0);
const projectionWidth = observable(1);
const projectionHeight = observable(1);
const projectionFOV = observable(40);
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

const eyePosition = computed(([projectionDist, projectionLon, projectionLat]) => {
    const lon = deg2rad(projectionLon);
    const lat = deg2rad(projectionLat);
    const dir = vec3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon),
    );
    return mul3(dir, projectionDist);
}, [projectionDist, projectionLon, projectionLat]);
eyePosition.on((eyePosition) => {
    projectionCamera.setEyePos(eyePosition);
});

const projectionSize = computed(
    ([projectionWidth, projectionHeight]) => vec2(projectionWidth, projectionHeight),
    [projectionWidth, projectionHeight],
);
projectionSize.on((projectionSize) => {
    projectionCamera.setViewportSize(projectionSize);
});

projectionFOV.on((projectionFOV) => {
    projectionCamera.setYFov(deg2rad(projectionFOV));
});
isPerpsectiveProjection.on((isPerpsectiveProjection) => {
    projectionCamera.setProjType(isPerpsectiveProjection ? 'perspective' : 'orthographic');
});

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

[model, camera.changed(), projectionCamera.changed()].forEach(
    (changed) => changed.on(() => runtime.requestFrameRender()),
);

runtime.frameRendered().on(() => {
    runtime.clearBuffer('color|depth');
    // Map ndc to unit range and get offset in ndc space.
    const coeff = 3 * (2 / camera.getXViewSize());
    for (const { primitive, offset } of primitives) {
        const program = primitive.program();
        fillTexture.setUnit(4);
        mappingTexture.setUnit(5);
        program.setUniform('u_offset', coeff * offset);
        program.setUniform('u_proj', camera.getProjMat());
        program.setUniform('u_view', camera.getViewMat());
        program.setUniform('u_model', model());
        program.setUniform('u_texture', 4);
        program.setUniform('u_planar_texture', 5);
        program.setUniform('u_planar_mat', projectionCamera.getTransformMat());
        primitive.render();

        if (isWireframeShown()) {
            const program = wireframe.program();
            program.setUniform('u_offset', coeff * offset);
            program.setUniform('u_proj', camera.getProjMat());
            program.setUniform('u_view', camera.getViewMat());
            program.setUniform('u_model', projectionCamera.getInvtransformMat());
            program.setUniform('u_color', wireframeColor);
            wireframe.render();
        }
    }
});

createControls(container, [
    { label: 'rotation', min: -180, max: +180, value: rotation },
    { label: 'position', min: -5, max: +5, step: 0.5, value: position },
    { label: 'proj dist', min: 0.2, max: 5, step: 0.2, value: projectionDist },
    { label: 'proj lon', min: -180, max: +180, value: projectionLon },
    { label: 'proj lat', min: -90, max: +90, value: projectionLat },
    { label: 'proj width', min: 0.1, max: 2, step: 0.1, value: projectionWidth },
    { label: 'proj height', min: 0.1, max: 2, step: 0.1, value: projectionHeight },
    { label: 'proj FOV', min: 1, max: 90, value: projectionFOV },
    { label: 'perspective', checked: isPerpsectiveProjection },
    { label: 'wifeframe', checked: isWireframeShown },
]);
