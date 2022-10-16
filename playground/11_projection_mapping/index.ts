import {
    Runtime,
    Primitive,
    Camera,
    color,
    vec2,
    vec3, mul3,
    mat4, apply4x4, identity4x4, yrotation4x4, translation4x4,
    deg2rad, spherical2zxy,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import { makeProgram, makeSphere, makeEllipse, makeCube, makePlane, makeWireframe } from './primitive';
import { makeColorTexture, makeMappingTexture } from './texture';

/**
 * Projection mapping.
 *
 * Shows projection mapping and projection wifeframe.
 * Additional point of view is used to implement mapping.
 * All parts of the scene objects that visible from the mapping point of view are colored with mapping texture.
 * By default objects are colored with a simple generated two-color texture.
 * Wireframe of lines shows mapping frustum. It is an [-1,+1] cube that is world trasnformed
 * with inversed mapping view-projection matrix.
 */
export type DESCRIPTION = never;

main();

interface PrimitiveData {
    readonly primitive: Primitive;
    readonly offset: number;
}

function main(): void {
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
    const colorTexture = makeColorTexture(runtime);
    const mappingTexture = makeMappingTexture(runtime, () => {
        runtime.requestFrameRender();
    });

    const wireframeColor = color(0.1, 0.1, 0.1);
    const camera = new Camera();
    camera.setEyePos(vec3(0, 2, 5));
    const mappingCamera = new Camera();

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
        const dir = spherical2zxy({ azimuth: deg2rad(projectionLon), elevation: deg2rad(projectionLat) });
        return mul3(dir, projectionDist);
    }, [projectionDist, projectionLon, projectionLat]);
    eyePosition.on((eyePosition) => {
        mappingCamera.setEyePos(eyePosition);
    });

    const projectionSize = computed(
        ([projectionWidth, projectionHeight]) => vec2(projectionWidth, projectionHeight),
        [projectionWidth, projectionHeight],
    );
    projectionSize.on((projectionSize) => {
        mappingCamera.setViewportSize(projectionSize);
    });

    projectionFOV.on((projectionFOV) => {
        mappingCamera.setYFov(deg2rad(projectionFOV));
    });
    isPerpsectiveProjection.on((isPerpsectiveProjection) => {
        mappingCamera.setProjType(isPerpsectiveProjection ? 'perspective' : 'orthographic');
    });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });

    [model, camera.changed(), mappingCamera.changed()].forEach(
        (changed) => changed.on(() => runtime.requestFrameRender()),
    );

    runtime.frameRendered().on(() => {
        runtime.clearBuffer('color|depth');
        // Map ndc to unit range and get offset in ndc space.
        const coeff = 3 * (2 / camera.getXViewSize());
        for (const { primitive, offset } of primitives) {
            const program = primitive.program();
            runtime.setTextureUnit(4, colorTexture);
            runtime.setTextureUnit(5, mappingTexture);
            program.setUniform('u_offset', coeff * offset);
            program.setUniform('u_proj', camera.getProjMat());
            program.setUniform('u_view', camera.getViewMat());
            program.setUniform('u_model', model());
            program.setUniform('u_texture', 4);
            program.setUniform('u_mapping_texture', 5);
            program.setUniform('u_mapping_mat', mappingCamera.getTransformMat());
            primitive.render();

            if (isWireframeShown()) {
                const program = wireframe.program();
                program.setUniform('u_offset', coeff * offset);
                program.setUniform('u_proj', camera.getProjMat());
                program.setUniform('u_view', camera.getViewMat());
                program.setUniform('u_model', mappingCamera.getInvtransformMat());
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
}
