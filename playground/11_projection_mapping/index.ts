import type { Primitive, Mat4, Mat4Mut } from 'lib';
import {
    createRenderState,
    OrbitCamera,
    color,
    vec3,
    mat4, apply4x4, identity4x4, yrotation4x4, translation4x4,
    deg2rad,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observablesFactory } from 'playground-utils/observable';
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

export function main(): () => void {
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
    const camera = new OrbitCamera();
    camera.setPosition({
        dist: 5,
        lon: 0,
        lat: Math.atan2(2, 5),
    });
    const mappingCamera = new OrbitCamera();

    const { observable, computed, dispose: disposeObservables } = observablesFactory();
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

    const projectionPos = computed(
        ([projectionDist, projectionLon, projectionLat]) => ({
            dist: projectionDist,
            lon: deg2rad(projectionLon),
            lat: deg2rad(projectionLat),
        }),
        [projectionDist, projectionLon, projectionLat],
    );
    projectionPos.on((pos) => {
        mappingCamera.setPosition(pos);
    });

    const projectionSize = computed(
        ([projectionWidth, projectionHeight]) => ({ x: projectionWidth, y: projectionHeight }),
        [projectionWidth, projectionHeight],
    );
    projectionSize.on((size) => {
        mappingCamera.setViewportSize(size);
    });

    projectionFOV.on((projectionFOV) => {
        mappingCamera.setYFov(deg2rad(projectionFOV));
    });
    isPerpsectiveProjection.on((isPerpsectiveProjection) => {
        mappingCamera.setProjType(isPerpsectiveProjection ? 'perspective' : 'orthographic');
    });

    const cancelTracking = trackSize(runtime, () => {
        camera.setViewportSize(runtime.canvasSize());
    });

    const cancelRender = renderOnChange(runtime, [model, camera, mappingCamera, isWireframeShown]);

    runtime.frameRequested().on(() => {
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

    return () => {
        disposeAll([
            disposeObservables, cancelTracking, cancelRender, controlRoot,
            program, ...primitives.map((p) => p.primitive), wireframe, colorTexture, mappingTexture, runtime,
        ]);
    };
}
