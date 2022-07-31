import {
    Runtime,
    Vec2, vec2, mul2,
    vec3,
    mat4, perspective4x4, apply4x4, identity4x4, translation4x4,
    color,
    fovSize2Dist,
} from 'lib';
import { makePrimitive } from './primitive';
import { makeTexture } from './texture';

/**
 * Texture mipmap.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
runtime.setDepthTest(true);
const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime, () => {
    runtime.requestRender();
});

const proj = mat4();
const YFOV = Math.PI / 4;
// Z-distance where [-0.5, +0.5] segment (of unit length) exactly matches full canvas height.
const DISTANCE = fovSize2Dist(YFOV, 1);

runtime.onSizeChanged(() => {
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

const RENDER_SCHEMA: ReadonlyArray<{ offset: Vec2, size: number }> = [
    { offset: vec2(0, 0), size: 1 },
    { offset: vec2(-1.5, +0.4), size: 0.2 },
    { offset: vec2(-1.5, -0.3), size: 0.4 },
    { offset: vec2(+2, 0), size: 1.2 },
    { offset: vec2(-1, +0.8), size: 0.5 },
    { offset: vec2(-1, -0.8), size: 0.3 },
    { offset: vec2(+1, -0.8), size: 0.1 },
    { offset: vec2(+1, +0.8), size: 0.15 },
];

let animationAngle = 0;
const PI2 = Math.PI * 2;
const ANIMATION_SPEED = PI2 / 10;
const ANIMATION_RADIUS = 10;

runtime.onRender((delta) => {
    runtime.clearBuffer('color|depth');
    const program = primitive.program();

    const { x: xCanvas, y: yCanvas } = runtime.canvasSize();

    animationAngle = (animationAngle + delta * ANIMATION_SPEED / 1000) % PI2;
    const dx = ANIMATION_RADIUS * 2 / xCanvas * Math.cos(animationAngle);
    const dy = ANIMATION_RADIUS * 2 / yCanvas * Math.sin(animationAngle);

    program.setUniform('u_proj', proj);
    program.setUniform('u_texture', 1);
    const unitSize = mul2(texture.size(), 1 / yCanvas);
    // tex / [-1, +1] ~ tex_size / screen_size
    const kx = 2 * texture.size().x / xCanvas;
    const ky = 2 * texture.size().y / yCanvas;

    for (const { offset, size } of RENDER_SCHEMA) {
        program.setUniform('u_offset', vec2(offset.x * kx + dx, offset.y * ky + dy));
        program.setUniform('u_size', mul2(unitSize, size));
        primitive.render();
    }

    runtime.requestRender();
});
