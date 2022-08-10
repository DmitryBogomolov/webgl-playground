import {
    Runtime,
    Primitive,
    Program,
    Texture,
    parseVertexSchema,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';
import { convolutionKernels } from './convolution_kernels';

/**
 * Texture filters.
 *
 * Shows how to apply custom texture processing neighbor pixels processing.
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
    const vertices = new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
    ]);
    const indices = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);
    primitive.allocateVertexBuffer(vertices.byteLength);
    primitive.updateVertexData(vertices);
    primitive.allocateIndexBuffer(indices.byteLength);
    primitive.updateIndexData(indices);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indices.length });
    primitive.setProgram(program);
    return primitive;
}

function makeTexture(runtime: Runtime): Texture {
    const texture = new Texture(runtime);
    texture.setParameters({
        min_filter: 'nearest',
        mag_filter: 'nearest',
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
    });

    const image = new Image();
    image.src = '/static/leaves.jpg';
    image.onload = () => {
        image.onload = null;
        texture.setImageData(image, { unpackFlipY: true });
        runtime.requestRender();
    };

    return texture;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

const kernelName = observable(convolutionKernels[0].name);
const currentKernel = computed(([name]) => {
    return convolutionKernels.find((kernel) => kernel.name === name)!;
}, [kernelName]);
currentKernel.on(() => runtime.requestRender());

runtime.onRender(() => {
    runtime.clearBuffer();
    texture.setUnit(3);
    const program = primitive.program();
    program.setUniform('u_canvas_size', runtime.canvasSize());
    program.setUniform('u_texture_size', texture.size());
    program.setUniform('u_texture', 3);
    program.setUniform('u_kernel', currentKernel().kernel);
    program.setUniform('u_kernel_weight', currentKernel().weight);
    primitive.render();
});

createControls(container, [
    { label: 'kernel', options: convolutionKernels.map((kernel) => kernel.name), selection: kernelName },
]);
