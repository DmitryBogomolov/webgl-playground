import {
    RenderLoop,
    VertexWriter,
    // FluentVertexWriter as VertexWriter,
    VertexSchema,
    Runtime_,
    Program_,
    Primitive_,
    writeVertices,
    generateDefaultIndexes, logSilenced,
} from 'lib';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

/**
 * Just four triangles of different colors.
 */

function makePrimitive(runtime: Runtime_): Primitive_ {
    const schema = new VertexSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
        {
            name: 'a_color',
            type: 'ubyte3',
            normalized: true,
        },
    ]);
    const program = new Program_(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive_(runtime);

    const c1 = [1, 0, 0]; // red
    const c2 = [1, 1, 0]; // yellow
    const c3 = [0, 1, 0]; // green
    const c4 = [0, 1, 1]; // cyan
    const vertices = [
        // bottom-left
        { position: [-1, +0], color: c1 },
        { position: [-1, -1], color: c1 },
        { position: [+0, -1], color: c1 },
        // bottom-right
        { position: [+0, -1], color: c2 },
        { position: [+1, -1], color: c2 },
        { position: [+1, +0], color: c2 },
        // top-right
        { position: [+1, +0], color: c3 },
        { position: [+1, +1], color: c3 },
        { position: [+0, +1], color: c3 },
        // top-left
        { position: [+0, +1], color: c4 },
        { position: [-1, +1], color: c4 },
        { position: [-1, +0], color: c4 },
    ];

    const vertexData = new ArrayBuffer(vertices.length * schema.vertexSize);
    writeVertices(new VertexWriter(vertexData, schema), vertices, (vertex) => ({
        a_position: vertex.position,
        a_color: vertex.color,
    }));
    const indexData = new Uint16Array(generateDefaultIndexes(vertices.length));

    primitive.setData(vertexData, indexData);
    primitive.setProgram(program);

    return primitive;
}

// eslint-disable-next-line no-undef
const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime_(container);
const primitive = makePrimitive(runtime);
const loop = new RenderLoop(() => {
    runtime.clearColor();
    primitive.draw();
});
loop.start();
logSilenced(true);
