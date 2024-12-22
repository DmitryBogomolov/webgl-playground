import type { Runtime } from 'lib';
import { Primitive, Program, Texture, makeImage, parseVertexSchema } from 'lib';
import { setup, disposeAll } from 'playground-utils/setup';
import { observable, computed } from 'playground-utils/observable';
import { createControls } from 'playground-utils/controls';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';
import { convolutionKernels } from './convolution_kernels';

/**
 * Texture filters.
 *
 * Shows how to apply custom texture processing neighbor pixels processing.
 */
export type DESCRIPTION = never;

export function main(): () => void {
    const { runtime, container } = setup();
    const primitive = makePrimitive(runtime);
    const texture = makeTexture(runtime);

    const kernelName = observable(convolutionKernels[0].name);
    const currentKernel = computed(([name]) => {
        return convolutionKernels.find((kernel) => kernel.name === name)!;
    }, [kernelName]);
    currentKernel.on(() => runtime.requestFrameRender());

    runtime.frameRequested().on(() => {
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

    const control = createControls(container, [
        { label: 'kernel', options: convolutionKernels.map((kernel) => kernel.name), selection: kernelName },
    ]);

    return () => {
        disposeAll([primitive.program(), primitive, runtime, currentKernel, kernelName, control]);
    };
}

function makePrimitive(runtime: Runtime): Primitive {
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    const primitive = new Primitive({ runtime });
    const vertexData = new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
    ]);
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);
    const vertexSchema = parseVertexSchema({
        attributes: [{ type: 'float2' }],
    });
    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);
    return primitive;
}

function makeTexture(runtime: Runtime): Texture {
    const texture = new Texture({ runtime });
    texture.setParameters({
        min_filter: 'nearest',
        mag_filter: 'nearest',
    });

    makeImage({ url: '/static/leaves.jpg' }).then(
        (image) => {
            texture.setImageData(image, { unpackFlipY: true });
            runtime.requestFrameRender();
        },
        console.error,
    );

    return texture;
}
