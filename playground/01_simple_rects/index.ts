import {
    VertexWriter,
    parseVertexSchema,
    Runtime,
    Program,
    Primitive,
    generateDefaultIndexes,
    colors, Color,
    Vec2, vec2,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

/**
 * Just four triangles of different colors.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

interface Vertex {
    readonly position: Vec2;
    readonly color: Color;
}

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
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
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive(runtime);

    const c1 = colors.RED;
    const c2 = colors.YELLOW;
    const c3 = colors.GREEN;
    const c4 = colors.CYAN;
    const vertices: Vertex[] = [
        // bottom-left
        { position: vec2(-1, +0), color: c1 },
        { position: vec2(-1, -1), color: c1 },
        { position: vec2(+0, -1), color: c1 },
        // bottom-right
        { position: vec2(+0, -1), color: c2 },
        { position: vec2(+1, -1), color: c2 },
        { position: vec2(+1, +0), color: c2 },
        // top-right
        { position: vec2(+1, +0), color: c3 },
        { position: vec2(+1, +1), color: c3 },
        { position: vec2(+0, +1), color: c3 },
        // top-left
        { position: vec2(+0, +1), color: c4 },
        { position: vec2(-1, +1), color: c4 },
        { position: vec2(-1, +0), color: c4 },
    ];

    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 'a_position', vertex.position);
        writer.writeAttribute(i, 'a_color', vertex.color);
    }
    const indexData = new Uint16Array(generateDefaultIndexes(vertices.length));

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexCount(indexData.length);
    primitive.setProgram(program);

    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);
runtime.onRender(() => {
    runtime.clearBuffer();
    primitive.render();
});
