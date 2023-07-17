import type { VertexSchema, Color, Vec2, PrimitiveVertexSchema } from 'lib';
import {
    Runtime,
    Primitive,
    Program,
    // parseVertexSchema, VertexWriter,
    VertexWriter2,
    color,
    vec2,
} from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

/**
 * Vertex data interleaving.
 *
 * Shows two ways of vertex layout - Array of Structure (AoS) and Structure of Arrays (SoA).
 * https://en.wikipedia.org/wiki/AoS_and_SoA
 */
export type DESCRIPTION = never;

main();

interface Vertex {
    readonly position: Vec2;
    readonly color: Color;
    readonly factor: number;
}

function main(): void {
    const containerAoS = document.querySelector<HTMLElement>(PLAYGROUND_ROOT + '-aos')!;
    const containerSoA = document.querySelector<HTMLElement>(PLAYGROUND_ROOT + '-soa')!;

    const vertices: Vertex[] = [
        { position: vec2(-1, -1), color: color(0, 1, 0), factor: 0.3 },
        { position: vec2(+1, -1), color: color(0, 0, 1), factor: 0.5 },
        { position: vec2(+1, +1), color: color(0, 1, 0), factor: 0.7 },
        { position: vec2(-1, +1), color: color(0, 0, 1), factor: 0.9 },
    ];
    const indices = [0, 1, 2, 2, 3, 0];

    setup(containerAoS, (runtime) => makeAoSPrimitive(runtime, vertices, indices));
    setup(containerSoA, (runtime) => makeSoAPrimitive(runtime, vertices, indices));
}

function makeAoSPrimitive(
    runtime: Runtime, vertices: ReadonlyArray<Vertex>, indices: ReadonlyArray<number>,
): Primitive {
    // const schema = parseVertexSchema([
    //     { name: 'a_position', type: 'float2' },
    //     { name: 'a_color', type: 'ubyte3', normalized: true },
    //     { name: 'a_factor', type: 'ubyte1', normalized: true },
    // ]);
    const schema2: PrimitiveVertexSchema = {
        attrs: [
            { type: 'float2' },
            { type: 'ubyte3', normalized: true },
            { type: 'ubyte', normalized: true },
        ],
    };
    return makePrimitive(runtime, schema2, vertices.length * 16, vertices, indices);
}

function makeSoAPrimitive(
    runtime: Runtime, vertices: ReadonlyArray<Vertex>, indices: ReadonlyArray<number>,
): Primitive {
    // const schema = parseVertexSchema([
    //     { name: 'a_color', type: 'ubyte3', normalized: true, offset: 0, stride: 4 },
    //     { name: 'a_position', type: 'float2', offset: 16, stride: 8 },
    //     { name: 'a_factor', type: 'ubyte1', normalized: true, offset: 48, stride: 4 },
    // ]);
    const schema2: PrimitiveVertexSchema = {
        attrs: [
            { type: 'float2', offset: 16, stride: 8 },
            { type: 'ubyte3', normalized: true, offset: 0, stride: 4 },
            { type: 'ubyte', normalized: true, offset: 48, stride: 4 },
        ],
    };
    return makePrimitive(runtime, schema2, 64, vertices, indices);
}

function makePrimitive(
    runtime: Runtime, schema: PrimitiveVertexSchema, arrayBufferSize: number,
    vertices: ReadonlyArray<Vertex>, indices: ReadonlyArray<number>,
): Primitive {
    const program = new Program(runtime, {
        vertShader,
        fragShader,
        // schema,
    });
    const primitive = new Primitive(runtime);

    const vertexData = new ArrayBuffer(arrayBufferSize);
    const writer = new VertexWriter2(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, color, factor } = vertices[i];
        writer.writeAttribute(i, 0, position);
        writer.writeAttribute(i, 1, color);
        writer.writeAttribute(i, 2, factor);
    }

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indices.length * 2);
    primitive.updateIndexData(new Uint16Array(indices));
    primitive.setVertexSchema_TODO(schema);
    primitive.setIndexConfig({ indexCount: indices.length });
    primitive.setProgram(program);

    return primitive;
}

function setup(container: HTMLElement, makePrimitive: (runtime: Runtime) => Primitive): void {
    const runtime = new Runtime(container);
    const primitive = makePrimitive(runtime);
    runtime.frameRequested().on(() => {
        runtime.clearBuffer();
        primitive.render();
    });
}
