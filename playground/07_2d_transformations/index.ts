import {
    Runtime,
    color,
    colors,
    vec2,
    mat3,
} from 'lib';
import { makePrimitiveFactory } from './primitive';

/**
 * 2D Transformations.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setClearColor(color(0.7, 0.7, 0.7));
const makePrimitive = makePrimitiveFactory(runtime);
const primitive = makePrimitive(colors.BLUE);

// const transform = mat3.identity();
// mat3.scale(transform, vec2(1.2, 1.2));
// mat3.translate(transform, vec2(0.4, 0.2));

runtime.onRender(() => {
    runtime.clearColorBuffer();
    const program = primitive.program();
    const transform = mat3.identity();
    mat3.scale(transform, vec2(50, 50));
    mat3.rotate(transform, Math.PI / 4);
    mat3.project(transform, runtime.canvasSize(), undefined);
    program.setUniform('u_transform', transform);
    primitive.render();
});

