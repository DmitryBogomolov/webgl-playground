import {
    Runtime,
    Primitive,
    Program,
    TextureCube,
    Camera,
    parseVertexSchema,
} from 'lib';
import vertShader from './shaders/skybox.vert';
import fragShader from './shaders/skybox.frag';

/**
 * Skybox.
 *
 * TODO...
 */
export type DESCRIPTION = never;

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    const quad = makeQuad(runtime);
    const texture = makeTexture(runtime);
    const camera = new Camera();
    camera.changed().on(() => runtime.requestFrameRender());
    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, quad, camera);
    });
}

function renderFrame(runtime: Runtime, primitive: Primitive, camera: Camera): void {
    runtime.clearBuffer('color|depth');

    primitive.program().setUniform('u_view_proj', camera.getTransformMat());
    primitive.render();
}

function makeQuad(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
    ]);

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
    return texture;
}

main();
