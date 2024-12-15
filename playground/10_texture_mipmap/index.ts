import type { Mat4Mut } from 'lib';
import type { Observable } from 'playground-utils/observable';
import {
    createRenderState,
    TEXTURE_MAG_FILTER, TEXTURE_MIN_FILTER,
    vec2, mul2,
    vec3,
    mat4, perspective4x4, apply4x4, mul4x4, identity4x4, translation4x4, xrotation4x4, yrotation4x4,
    color,
    fovSize2Dist, deg2rad,
} from 'lib';
import { setup } from 'playground-utils/setup';
import { trackSize } from 'playground-utils/resizer';
import { observable } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import { animation } from 'playground-utils/animation';
import { makePrimitive } from './primitive';
import { makeTexture } from './texture';

/**
 * Texture mipmap.
 *
 * Shows difference magnification and minification filters.
 * Filters can be selected through controls.
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const { runtime, container } = setup();
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
    const primitive = makePrimitive(runtime);
    const texture = makeTexture(runtime, () => {
        runtime.requestFrameRender();
    });
    texture.setParameters({
        mag_filter: 'nearest',
        min_filter: 'nearest',
    });

    const proj = mat4() as Mat4Mut;
    const YFOV = Math.PI / 3;
    // Z-distance where [-0.5, +0.5] segment (of unit length) exactly matches full canvas height.
    const DISTANCE = fovSize2Dist(YFOV, 1);

    trackSize(runtime, () => {
        identity4x4(proj);
        apply4x4(proj, translation4x4, vec3(0, 0, -DISTANCE));
        const { x, y } = runtime.canvasSize();
        apply4x4(proj, perspective4x4, {
            yFov: YFOV,
            aspect: x / y,
            zNear: 0.001,
            zFar: 100,
        });
    });

    const RENDER_SCHEMA = [
        { offset: vec2(0, 0), size: 1 },
        { offset: vec2(-1.5, +0.4), size: 0.2 },
        { offset: vec2(-1.5, -0.3), size: 0.4 },
        { offset: vec2(+2, 0), size: 1.2 },
        { offset: vec2(-1, +0.8), size: 0.5 },
        { offset: vec2(-1, -0.8), size: 0.3 },
        { offset: vec2(+1, -0.8), size: 0.1 },
        { offset: vec2(+1, +0.8), size: 0.15 },
    ] as const;

    let animationAngle = 0;

    const PI2 = Math.PI * 2;
    const ANIMATION_SPEED = PI2 / 10;
    const ANIMATION_RADIUS = 10;

    const xRotation = observable(0);
    const yRotation = observable(0);
    const mat = mat4() as Mat4Mut;

    const MAG_FILTER_OPTIONS: ReadonlyArray<TEXTURE_MAG_FILTER> = ['nearest', 'linear'];
    const MIN_FILTER_OPTIONS: ReadonlyArray<TEXTURE_MIN_FILTER> = [
        'nearest', 'linear',
        'nearest_mipmap_nearest', 'linear_mipmap_nearest', 'nearest_mipmap_linear', 'linear_mipmap_linear',
    ];
    const magFilter = observable(MAG_FILTER_OPTIONS[0]) as Observable<string>;
    const minFilter = observable(MIN_FILTER_OPTIONS[0]) as Observable<string>;

    magFilter.on((value) => {
        texture.setParameters({
            mag_filter: value as TEXTURE_MAG_FILTER,
        });
    });
    minFilter.on((value) => {
        texture.setParameters({
            min_filter: value as TEXTURE_MIN_FILTER,
        });
    });

    [xRotation, yRotation, magFilter, minFilter]
        .forEach((item) => item.on(() => runtime.requestFrameRender()));

    runtime.frameRequested().on((delta) => {
        runtime.clearBuffer('color|depth');
        const program = primitive.program();

        const { x: xCanvas, y: yCanvas } = runtime.canvasSize();

        if (delta < 250) {
            animationAngle = (animationAngle + delta * ANIMATION_SPEED / 1000) % PI2;
        }
        const dx = ANIMATION_RADIUS * 2 / xCanvas * Math.cos(animationAngle);
        const dy = ANIMATION_RADIUS * 2 / yCanvas * Math.sin(animationAngle);

        identity4x4(mat);
        apply4x4(mat, xrotation4x4, deg2rad(xRotation()));
        apply4x4(mat, yrotation4x4, deg2rad(yRotation()));
        mul4x4(proj, mat, mat);

        runtime.setTextureUnit(4, texture);
        program.setUniform('u_proj', mat);
        program.setUniform('u_texture', 4);
        const unitSize = mul2(texture.size(), 1 / yCanvas);
        // tex / [-1, +1] ~ tex_size / screen_size
        const kx = 2 * texture.size().x / xCanvas;
        const ky = 2 * texture.size().y / yCanvas;

        for (const { offset, size } of RENDER_SCHEMA) {
            program.setUniform('u_offset', vec2(offset.x * kx + dx, offset.y * ky + dy));
            program.setUniform('u_size', mul2(unitSize, size));
            primitive.render();
        }
    });

    createControls(container, [
        { label: 'x rotation', min: -30, max: +30, value: xRotation },
        { label: 'y rotation', min: -30, max: +30, value: yRotation },
        { label: 'mag filter', options: MAG_FILTER_OPTIONS, selection: magFilter },
        { label: 'min filter', options: MIN_FILTER_OPTIONS, selection: minFilter },
    ]);

    animation(runtime);
}
