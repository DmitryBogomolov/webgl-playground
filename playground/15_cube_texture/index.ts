import type { Runtime } from 'lib';
import type { MainFuncInput, MainFuncOutput } from 'playground-utils/setup';
import {
    createRenderState,
    Primitive,
    Program,
    TextureCube,
    ViewProj,
    generateCube,
    UNIT3,
    parseVertexSchema,
} from 'lib';
import { trackBall } from 'playground-utils/track-ball';
import vertShader from './shaders/cube.vert';
import fragShader from './shaders/cube.frag';

/**
 * Cube texture.
 *
 * Shows usage of cube textures. Simple cube is rendered.
 * Vertex positions (normalized) are used as texture coordinates.
 */
export type DESCRIPTION = never;

export function main({ setup, renderOnChange }: MainFuncInput): MainFuncOutput {
    const { runtime } = setup();
    runtime.setRenderState(createRenderState({
        depthTest: true,
    }));
    const vp = new ViewProj();

    const cancelRender = renderOnChange(runtime, [vp]);

    const primitive = makePrimitive(runtime);
    const texture = makeTexture(runtime);

    runtime.renderSizeChanged.on(() => {
        vp.setViewportSize(runtime.renderSize);
    });

    runtime.frameRequested.on(() => {
        runtime.clearBuffer('color|depth');

        runtime.setCubeTextureUnit(2, texture);
        primitive.program().setUniform('u_view_proj', vp.getTransformMat());
        primitive.program().setUniform('u_texture', 2);
        primitive.render();
    });

    const disposeTrackBall = trackBall({
        element: runtime.canvas,
        distance: { fixed: 2 },
        initial: { x: 0, y: 1, z: 2 },
        callback: (v) => {
            vp.setEyePos(v);
        },
    });

    return [cancelRender, disposeTrackBall, primitive.program(), primitive, texture, runtime];
}

function makePrimitive(runtime: Runtime): Primitive {
    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex.position);

    const vertexData = new Float32Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; ++i) {
        const { x, y, z } = vertices[i];
        vertexData[3 * i + 0] = x;
        vertexData[3 * i + 1] = y;
        vertexData[3 * i + 2] = z;
    }
    const indexData = new Uint16Array(indices);
    const vertexSchema = parseVertexSchema({
        attributes: [{ type: 'float3' }],
    });

    const primitive = new Primitive({ runtime });
    primitive.setup({ vertexData, indexData, vertexSchema });
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

function makeTexture(runtime: Runtime): TextureCube {
    const texture = new TextureCube({ runtime });
    texture.setImageData({
        xNeg: makeCanvas('-X', '#ff0', '#00f'),
        xPos: makeCanvas('+X', '#f00', '#0ff'),
        yNeg: makeCanvas('-Y', '#0ff', '#f00'),
        yPos: makeCanvas('+Y', '#0f0', '#f0f'),
        zNeg: makeCanvas('-Z', '#f0f', '#0f0'),
        zPos: makeCanvas('+Z', '#00f', '#ff0'),
    });
    return texture;
}

function makeCanvas(text: string, textColor: string, backgroundColor: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 128, 128);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.font = '96px sans-serif';
    ctx.fillText(text, 64, 64);
    return canvas;
}
