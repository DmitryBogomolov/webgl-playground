import type { VertexSchemaDefinition, Vec2, Color } from 'lib';
import { Runtime, Program, Primitive, VertexWriter, colors, vec2 } from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

/**
 * Just four triangles of different colors.
 */
export type DESCRIPTION = never;

main();

interface Vertex {
    readonly position: Vec2;
    readonly color: Color;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime({ element: container });
    const primitive = makePrimitive(runtime);
    runtime.frameRequested().on(() => {
        runtime.clearBuffer();
        primitive.render();
    });
}

function makePrimitive(runtime: Runtime): Primitive {
    const vertexSchema: VertexSchemaDefinition = {
        attributes: [
            { type: 'float2' },
            { type: 'ubyte4', normalized: true },
        ],
    };
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    const primitive = new Primitive({ runtime });

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

    const vertexData = new ArrayBuffer(vertices.length * 12);
    const writer = new VertexWriter(vertexSchema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i];
        writer.writeAttribute(i, 0, vertex.position);
        writer.writeAttribute(i, 1, vertex.color);
    }
    const indexData = new Uint16Array(
        Array(vertices.length).fill(0).map((_, i) => i),
    );

    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);

    return primitive;
}
