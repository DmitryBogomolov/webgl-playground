import {
    Runtime,
    color,
    colors,
    Vec2,
    vec2,
    mat3,
    projection3x3,
    mul3x3,
    memoize,
} from 'lib';
import { makePrimitiveFactory } from './primitive';
import { makeAnimation } from './animation';
import { makeFigureRenderer } from './figure';

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
const render1 = makeFigureRenderer(makePrimitive, colors.BLUE, vec2(50, 50));
const render2 = makeFigureRenderer(makePrimitive, colors.RED, vec2(30, 30));
const render3 = makeFigureRenderer(makePrimitive, colors.GREEN, vec2(20, 20));
const animate1 = makeAnimation(vec2(800, 320), Math.PI / 6);
const animate2 = makeAnimation(vec2(400, 160), -Math.PI / 2);
const animate3 = makeAnimation(vec2(320, 200), +Math.PI / 3);
const transformation1 = mat3();
const transformation2 = mat3();
const transformation3 = mat3();

const projection = mat3();
const updateProjection = memoize((canvasSize: Vec2): void => {
    projection3x3(canvasSize, undefined, projection);
});

runtime.onRender((delta) => {
    runtime.clearBuffer();
    updateProjection(runtime.canvasSize());
    animate1(delta, transformation1);
    animate2(delta, transformation2);
    animate3(delta, transformation3);
    mul3x3(transformation1, transformation2, transformation2);
    mul3x3(transformation1, transformation3, transformation3);
    render1(projection, transformation1);
    render2(projection, transformation2);
    render3(projection, transformation3);
    runtime.requestRender();
});
