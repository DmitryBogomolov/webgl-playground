import {
    Runtime,
    Primitive,
    Program,
    Texture,
    parseVertexSchema,
    loadImage,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';
import { convolutionKernels } from './convolution_kernels';

/**
 * Texture filters.
 *
 * Shows how to apply custom texture processing neighbor pixels processing.
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    const primitive = makePrimitive(runtime);
    const texture = makeTexture(runtime);

    const kernelName = observable(convolutionKernels[0].name);
    const currentKernel = computed(([name]) => {
        return convolutionKernels.find((kernel) => kernel.name === name)!;
    }, [kernelName]);
    currentKernel.on(() => runtime.requestFrameRender());

    runtime.frameRendered().on(() => {
        runtime.clearBuffer();
        runtime.setTextureUnit(3, texture);
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
}

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
    ]);
    const program = new Program(runtime, {
        vertShader,
        fragShader,
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
    primitive.setIndexConfig({ indexCount: indices.length });
    primitive.setProgram(program);
    return primitive;
}

function makeTexture(runtime: Runtime): Texture {
    const texture = new Texture(runtime);
    texture.setParameters({
        min_filter: 'nearest',
        mag_filter: 'nearest',
    });

    loadImage('/static/leaves.jpg').then(
        (image) => {
            texture.setImageData(image, { unpackFlipY: true });
            runtime.requestFrameRender();
        },
        console.error,
    );

    return texture;
}
