import type { Primitive, Mat4, Mat4Mut } from 'lib';
import type { MainFuncInput, MainFuncOutput } from 'playground-utils/setup';
import {
    createRenderState,
    ViewProj,
    color,
    vec3,
    mat4, apply4x4, identity4x4, yrotation4x4, translation4x4,
    deg2rad,
    spherical2zxy,
} from 'lib';
import { observable, computed, bind } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
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

interface PrimitiveData {
    readonly primitive: Primitive;
    readonly offset: number;
}

export function main({ setup, renderOnChange }: MainFuncInput): MainFuncOutput {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
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
    const vp = new ViewProj();
    vp.setEyePos({
        x: 0,
        y: 2,
        z: 5,
    });
    const mappingVP = new ViewProj();

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

    const _model = mat4() as Mat4Mut;
    const model = computed(
        ([rotation, position]) => {
            const mat = _model;
            identity4x4(mat);
            apply4x4(mat, yrotation4x4, deg2rad(rotation));
            apply4x4(mat, translation4x4, vec3(position, 0, 0));
            return mat as Mat4;
        },
        [rotation, position],
    );

    bind(
        computed(
            ([projectionDist, projectionLon, projectionLat]) => {
                const lon = deg2rad(projectionLon);
                const lat = deg2rad(projectionLat);
                return spherical2zxy({ azimuth: lon, elevation: lat, distance: projectionDist });
            },
            [projectionDist, projectionLon, projectionLat],
        ),
        (projectionPos) => {
            mappingVP.setEyePos(projectionPos);
        },
    );

    bind(
        computed(
            ([projectionWidth, projectionHeight]) => ({ x: projectionWidth, y: projectionHeight }),
            [projectionWidth, projectionHeight],
        ),
        (projectionSize) => {
            mappingVP.setViewportSize(projectionSize);
        },
    );

    bind(
        projectionFOV,
        (projectionFOV) => {
            mappingVP.setYFov(deg2rad(projectionFOV));
        },
    );

    bind(
        isPerpsectiveProjection,
        (isPerpsectiveProjection) => {
            mappingVP.setProjType(isPerpsectiveProjection ? 'perspective' : 'orthographic');
        },
    );

    const cancelRender = renderOnChange(runtime, [model, vp, mappingVP, isWireframeShown]);

    runtime.renderSizeChanged.on(() => {
        vp.setViewportSize(runtime.renderSize);
    });

    runtime.frameRequested.on(() => {
        runtime.clearBuffer('color|depth');
        // Map ndc to unit range and get offset in ndc space.
        const coeff = 3 * (2 / vp.getXViewSize());
        for (const { primitive, offset } of primitives) {
            const program = primitive.program();
            runtime.setTextureUnit(4, colorTexture);
            runtime.setTextureUnit(5, mappingTexture);
            program.setUniform('u_offset', coeff * offset);
            program.setUniform('u_proj', vp.getProjMat());
            program.setUniform('u_view', vp.getViewMat());
            program.setUniform('u_model', model());
            program.setUniform('u_texture', 4);
            program.setUniform('u_mapping_texture', 5);
            program.setUniform('u_mapping_mat', mappingVP.getTransformMat());
            primitive.render();

            if (isWireframeShown()) {
                const program = wireframe.program();
                program.setUniform('u_offset', coeff * offset);
                program.setUniform('u_proj', vp.getProjMat());
                program.setUniform('u_view', vp.getViewMat());
                program.setUniform('u_model', mappingVP.getInvtransformMat());
                program.setUniform('u_color', wireframeColor);
                wireframe.render();
            }
        }
    });

    const controlRoot = createControls(container, [
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

    return [
        cancelRender, controlRoot,
        program, ...primitives.map((p) => p.primitive), wireframe, colorTexture, mappingTexture, runtime,
    ];
}
