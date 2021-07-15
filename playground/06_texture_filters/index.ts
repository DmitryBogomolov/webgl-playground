import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
} from 'lib';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

/**
 * Texture filters.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive(runtime);
    primitive.setProgram(program);
    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);

runtime.onRender(() => {
    runtime.clearColorBuffer();
    primitive.render();
});
