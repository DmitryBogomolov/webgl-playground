import {
    RenderLoop,
    VertexWriter,
    // FluentVertexWriter as VertexWriter,
    VertexSchema,
    Runtime_,
    Program_,
    Primitive_,
    generateDefaultIndexes, logSilenced,
    colors, color2array,
} from 'lib';
import vertexShaderSource from './shader.vert';
import fragmentShaderSource from './shader.frag';

/**
 * Just four triangles of different colors.
 */
export type DESCRIPTION = never;

function makePrimitive(runtime: Runtime_): Primitive_ {
    const schema = new VertexSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
        {
            name: 'a_color',
            type: 'ubyte4',
            normalized: true,
        },
    ]);
    const program = new Program_(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive_(runtime);

    const c1 = colors.RED;
    const c2 = colors.YELLOW;
    const c3 = colors.GREEN;
    const c4 = colors.CYAN;
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
    const writer = new VertexWriter(vertexData, schema);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex.position);
        writer.writeAttribute(i, 'a_color', color2array(vertex.color));
    }
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
