import {
    Runtime,
    Primitive,
    Program,
    // Texture,
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
const camera = new Camera();
camera.setEyePos(vec3(0, 1, 2));

const primitive = makePrimitive(runtime);
// const texture = makeTexture(runtime);

runtime.sizeChanged().on(() => {
    camera.setViewportSize(runtime.canvasSize());
});

runtime.frameRendered().on(() => {
    runtime.clearBuffer('color|depth');

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

// function makeTexture(runtime: Runtime): Texture {
//     return null;
// }
