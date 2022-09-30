import {
    Runtime,
    Primitive,
    Program,
    TextureCube,
    Camera,
    parseVertexSchema,
    generateCube,
    vec3, UNIT3,
} from 'lib';
import vertShader from './shaders/cube.vert';
import fragShader from './shaders/cube.frag';

/**
 * Cube texture.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);
const camera = new Camera();
camera.setEyePos(vec3(0, 1, 2));

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

runtime.frameRendered().on(() => {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(2, texture);
    primitive.program().setUniform('u_view_proj', camera.getTransformMat());
    primitive.render();
});

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        {
            name: 'a_position',
            type: 'float3',
        },
    ]);

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex.position);

    const vertexData = new Float32Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; ++i) {
        const { x, y, z } = vertices[i];
        vertexData[3 * i + 0] = x;
        vertexData[3 * i + 1] = y;
        vertexData[3 * i + 2] = z;
    }
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive(runtime);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

function makeTexture(runtime: Runtime): TextureCube {
    const texture = new TextureCube(runtime);
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
