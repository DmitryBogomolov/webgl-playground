import {
    Runtime,
    Primitive,
    Program,
    Texture,
    parseVertexSchema,
} from 'lib';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';
import { ConvolutionKernel, convolutionKernels } from './convolution_kernels';

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
    primitive.setIndexCount(indices.length);
    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);

const texture = new Texture(runtime);
texture.setUnit(1);
texture.setParameters({
    min_filter: 'nearest',
    mag_filter: 'nearest',
    wrap_s: 'clamp_to_edge',
    wrap_t: 'clamp_to_edge',
});

runtime.onRender(() => {
    runtime.clearColorBuffer();
    const program = primitive.program();
    const kernel = convolutionKernels.edgeDetect2;
    program.setUniform('u_canvas_size', runtime.canvasSize());
    program.setUniform('u_texture_size', texture.size());
    program.setUniform('u_texture', 1);
    program.setUniform('u_kernel', kernel);
    program.setUniform('u_kernel_weight', computeKernelWeight(kernel));
    primitive.render();
});

const image = new Image();
image.src = '/static/leaves.jpg';
image.onload = () => {
    image.onload = null;
    texture.setImageData(image, true);
    runtime.requestRender();
};

function computeKernelWeight(kernel: ConvolutionKernel): number {
    let sum = 0;
    for (const item of kernel) {
        sum += item;
    }
    return sum <= 0 ? 1 : sum;
}
