import {
    Runtime,
    Primitive,
    color,
    colors,
    Vec2,
    vec2,
    Mat3,
    mat3,
    memoize,
} from 'lib';
import { makePrimitiveFactory } from './primitive';
import { makeAnimation } from './animation';

/**
 * 2D Transformations.
 *
 * Basic 2D transformations, relative transformations, 2D pixel-aware projection.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
const makePrimitive = makePrimitiveFactory(runtime);
const primitive1 = makePrimitive(colors.BLUE);
const size1 = vec2(50, 50);
const animate1 = makeAnimation(vec2(800, 320), Math.PI / 6);
const primitive2 = makePrimitive(colors.RED);
const size2 = vec2(30, 30);
const animate2 = makeAnimation(vec2(400, 160), -Math.PI / 2);
const primitive3 = makePrimitive(colors.GREEN);
const size3 = vec2(20, 20);
const animate3 = makeAnimation(vec2(320, 200), +Math.PI / 3);

const getProjection = memoize((canvasSize: Vec2): Mat3 => mat3.projection(canvasSize));

runtime.onRender((delta) => {
    runtime.clearColorBuffer();
    const projection = getProjection(runtime.canvasSize());
    const transformation1 = animate1(delta);
    const transformation2 = animate2(delta);
    mat3.mul(transformation1, transformation2, transformation2);
    const transformation3 = animate3(delta);
    mat3.mul(transformation1, transformation3, transformation3);
    renderPrimitive(primitive1, size1, projection, transformation1);
    renderPrimitive(primitive2, size2, projection, transformation2);
    renderPrimitive(primitive3, size3, projection, transformation3);
    runtime.requestRender();
});

function renderPrimitive(primitive: Primitive, size: Vec2, projection: Mat3, transformation: Mat3): void {
    const mat = mat3.identity();
    mat3.scale(mat, size);
    mat3.mul(transformation, mat, mat);
    mat3.mul(projection, mat, mat);
    primitive.program().setUniform('u_transform', mat);
    primitive.render();
}
