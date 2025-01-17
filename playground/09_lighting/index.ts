import type { Program, SHADER_UNIFORM_VALUE, Vec3, Vec3Mut, Mat4, Mat4Mut, Color } from 'lib';
import type { Observable } from 'playground-utils/observable';
import {
    createRenderState,
    vec2,
    ZERO3, YUNIT3, vec3, neg3, mul3, norm3,
    mat4, perspective4x4, lookAt4x4, identity4x4,
    apply4x4, yrotation4x4, translation4x4, mul4x4, inversetranspose4x4,
    color,
    deg2rad, fovDist2Size, spherical2zxy, Primitive,
} from 'lib';
import { setup, disposeAll, renderOnChange } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observablesFactory } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { makePrimitive, makeDirectionalProgram, makePointProgram, makeSpotProgram } from './primitive';

/**
 * Lighting.
 *
 * Different basic lighting techniques. Shows directional, point and spot lighting.
 */
export type DESCRIPTION = never;

export function main(): () => void {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.4, 0.4, 0.4));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
    const directionalProgram = makeDirectionalProgram(runtime);
    const pointProgram = makePointProgram(runtime);
    const spotProgram = makeSpotProgram(runtime);
    const primitive = makePrimitive(runtime, 8, vec3(3.2, 2, 2.4));

    const VIEW_DIR = norm3(vec3(0, 3, 5));
    const VIEW_DIST = 5;
    const YFOV = Math.PI / 3;
    const Y_VIEW_SIZE = fovDist2Size(YFOV, VIEW_DIST);
    const clr = color(0.2, 0.6, 0.1);

    const { observable, computed, dispose: disposeObservables } = observablesFactory();
    const offsetCoeff = observable(0);
    const rotation = observable(0);
    const position = observable(0);
    const lightLon = observable(45);
    const lightLat = observable(45);
    const lightDistance = observable(5);
    const lightLimitPoint = observable(5);
    const lightLimitRange = observable(10);

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

    const _model = mat4() as Mat4Mut;
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

    const _modelViewProj = mat4() as Mat4Mut;
    const modelViewProj = computed(
        ([model, view, proj]) => {
            const mat = _modelViewProj;
            identity4x4(mat);
            mul4x4(model, mat, mat);
            mul4x4(view, mat, mat);
            mul4x4(proj, mat, mat);
            return mat as Mat4;
        },
        [model, view, proj],
    );

    const _modelInvTrs = mat4() as Mat4Mut;
    const modelInvTrs = computed(
        ([model]) => inversetranspose4x4(model, _modelInvTrs),
        [model],
    );

    const lightDirection = computed(
        ([lightLon, lightLat]) => {
            const dir = spherical2zxy({ distance: 1, azimuth: deg2rad(lightLon), elevation: deg2rad(lightLat) });
            return neg3(dir, dir as Vec3Mut);
        },
        [lightLon, lightLat],
    );

    const lightPosition = computed(
        ([lightDirection, lightDistance]) => mul3(lightDirection as Vec3, -lightDistance),
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

    const cancelRender = renderOnChange(
        runtime,
        [offsetCoeff, modelViewProj, modelInvTrs, lightDirection, lightPosition, lightLimit],
    );

    const _proj = mat4() as Mat4Mut;
    const cancelTracking = trackSize(runtime, () => {
        const { x, y } = runtime.canvasSize();
        const xViewSize = x / y * Y_VIEW_SIZE;
        offsetCoeff(2 / xViewSize);
        perspective4x4({
            aspect: x / y,
            yFov: YFOV,
            zNear: 0.01,
            zFar: 100,
        }, _proj);
        proj(_proj);
    });

    runtime.frameRequested().on(() => {
        runtime.clearBuffer('color|depth');

        // Sphere x-diameter is 3.2. Let offset be a little bigger.
        const coeff = 4 * offsetCoeff();
        renderPrimitive(directionalProgram, primitive, clr, -coeff, {
            'u_light_direction': lightDirection(),
        }, modelViewProj, modelInvTrs);
        renderPrimitive(pointProgram, primitive, clr, 0, {
            'u_model': model(),
            'u_light_position': lightPosition(),
        }, modelViewProj, modelInvTrs);
        renderPrimitive(spotProgram, primitive, clr, +coeff, {
            'u_model': model(),
            'u_light_position': lightPosition(),
            'u_light_direction': lightDirection(),
            'u_light_limit': lightLimit(),
        }, modelViewProj, modelInvTrs);
    });

    const controlRoot = createControls(container, [
        { label: 'rotation', min: -180, max: +180, value: rotation },
        { label: 'position', min: -5, max: +5, step: 0.5, value: position },
        { label: 'light lon', min: -180, max: +180, value: lightLon },
        { label: 'light lat', min: -90, max: +90, value: lightLat },
        { label: 'light dist', min: 2, max: 10, value: lightDistance },
        { label: 'limit point', min: 0, max: 30, value: lightLimitPoint },
        { label: 'limit range', min: 0, max: 20, value: lightLimitRange },
    ]);

    return () => {
        disposeAll([
            disposeObservables, cancelTracking, cancelRender, controlRoot,
            directionalProgram, pointProgram, spotProgram, primitive, runtime,
        ]);
    };
}

function renderPrimitive(
    program: Program,
    primitive: Primitive,
    clr: Color,
    offset: number,
    uniforms: Record<string, SHADER_UNIFORM_VALUE>,
    modelViewProj: Observable<Mat4>,
    modelInvTrs: Observable<Mat4>,
): void {
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
