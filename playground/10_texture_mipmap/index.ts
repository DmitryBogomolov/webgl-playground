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
const texture = makeTexture(runtime);

const proj = mat4();
const YFOV = Math.PI / 4;
// Z-distance where [-0.5, +0.5] segment (of unit length) exactly matches full canvas height.
const DISTANCE = fovSize2Dist(YFOV, 1);

// Shows amount pixels that fit into segment of unit length.
let world2pxRatio = NaN;

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
    world2pxRatio = 1 / y;
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

runtime.onRender(() => {
    runtime.clearBuffer('color|depth');
    const program = primitive.program();

    program.setUniform('u_proj', proj);
    program.setUniform('u_texture', 1);
    const unitSize = mul2(texture.size(), world2pxRatio);
    // tex / [-1, +1] ~ tex_size / screen_size
    const kx = 2 * texture.size().x / runtime.canvasSize().x;
    const ky = 2 * texture.size().y / runtime.canvasSize().y;

    for (const { offset, size } of RENDER_SCHEMA) {
        program.setUniform('u_offset', vec2(offset.x * kx, offset.y * ky));
        program.setUniform('u_size', mul2(unitSize, size));
        primitive.render();
    }
});
