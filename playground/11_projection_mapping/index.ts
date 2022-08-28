import {
    Runtime,
    Camera,
    color,
    Vec2, vec2,
    vec3, ZERO3, YUNIT3, mul3, norm3,
    mat4, perspective4x4, lookAt4x4, orthographic4x4, apply4x4,
    mul4x4, identity4x4, yrotation4x4, translation4x4, inverse4x4,
    deg2rad, fovDist2Size, Primitive,
} from 'lib';
import { Observable, observable, computed } from 'util/observable';
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
const VIEW_DIR = norm3(vec3(0, 2, 5));
const VIEW_DIST = 5;
const YFOV = Math.PI / 3;
const Y_VIEW_SIZE = fovDist2Size(YFOV, VIEW_DIST);

const camera = new Camera();
camera.setEyePos(mul3(VIEW_DIR, VIEW_DIST));
const projectionCamera = new Camera();

const offsetCoeff = observable(0);
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

const proj = observable(
    mat4(),
    { noEqualityCheck: true },
);
const view = observable(
    lookAt4x4({
        eye: mul3(VIEW_DIR, VIEW_DIST),
        center: ZERO3,
        up: YUNIT3,
    }),
    { noEqualityCheck: true },
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

const _projectionView = mat4();
const projectionView = computed(([eyePosition]) => {
    lookAt4x4({
        eye: eyePosition,
        center: ZERO3,
        up: YUNIT3,
    }, _projectionView);
    // projectionCamera.setEyePos(eyePosition);
    return _projectionView;
}, [eyePosition]);

eyePosition.on((eyePosition) => {
    projectionCamera.setEyePos(eyePosition);
});

const projectionSize = computed(
    ([projectionWidth, projectionHeight]) => vec2(projectionWidth, projectionHeight),
    [projectionWidth, projectionHeight]
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

const _projectionProj = mat4();
const projectionProj = computed(([projectionSize, projectionFOV, isPerpsectiveProjection]) => {
    if (isPerpsectiveProjection) {
        perspective4x4({
            yFov: deg2rad(projectionFOV),
            aspect: projectionSize.x / projectionSize.y,
            zNear: 0.01,
            zFar: 100,
        }, _projectionProj);
    } else {
        orthographic4x4({
            left: -projectionSize.x / 2,
            right: +projectionSize.x / 2,
            bottom: -projectionSize.y / 2,
            top: +projectionSize.y / 2,
            zNear: 0.01,
            zFar: 100,
        }, _projectionProj);
    }
    // projectionCamera.setProjType(isPerpsectiveProjection ? 'perspective' : 'orthographic');
    // projectionCamera.setYFov(deg2rad(projectionFOV));
    // projectionCamera.setViewportSize(projectionSize);
    return _projectionProj;
}, [
    projectionSize, projectionFOV, isPerpsectiveProjection,
] as [Observable<Vec2>, Observable<number>, Observable<boolean>]);



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
runtime.sizeChanged().on(() => {
    const { x, y } = runtime.canvasSize();
    const xViewSize = x / y * Y_VIEW_SIZE;
    offsetCoeff(2 / xViewSize);
    // camera.setViewportSize({ x, y });
    perspective4x4({
        yFov: YFOV,
        aspect: x / y,
        zNear: 0.01,
        zFar: 100,
    }, _proj);
    proj(_proj);
});

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

// [offsetCoeff, model, view, proj, projectionMat, wireframeMat, isWireframeShown]
//     .forEach((item) => item.on(() => runtime.requestFrameRender()));

[model, camera.changed(), projectionCamera.changed()].forEach(
    (changed) => changed.on(() => runtime.requestFrameRender())
);
// model.on(() => runtime.requestFrameRender());
// camera.changed().on(() => runtime.requestFrameRender());
// projectionCamera.changed().on(() => runtime.requestFrameRender());

runtime.frameRendered().on(() => {
    runtime.clearBuffer('color|depth');
    const coeff = 3 * (2 / camera.getXViewSize());
    // const coeff = 3 * offsetCoeff();
    for (const { primitive, offset } of primitives) {
        const program = primitive.program();
        fillTexture.setUnit(4);
        mappingTexture.setUnit(5);
        program.setUniform('u_offset', coeff * offset);
        // program.setUniform('u_proj', proj());
        // program.setUniform('u_view', view());
        program.setUniform('u_proj', camera.getProjMat());
        program.setUniform('u_view', camera.getViewMat());
        program.setUniform('u_model', model());
        program.setUniform('u_texture', 4);
        program.setUniform('u_planar_texture', 5);
        // program.setUniform('u_planar_mat', projectionMat());
        program.setUniform('u_planar_mat', projectionCamera.getTransformMat());
        primitive.render();

        if (isWireframeShown()) {
            const program = wireframe.program();
            program.setUniform('u_offset', coeff * offset);
            // program.setUniform('u_proj', proj());
            // program.setUniform('u_view', view());
            program.setUniform('u_proj', camera.getProjMat());
            program.setUniform('u_view', camera.getViewMat());
            // program.setUniform('u_model', wireframeMat());
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
