import type { VertexSchemaDefinition, Color, Vec2 } from 'lib';
import {
    Runtime,
    Primitive,
    Program,
    VertexWriter,
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
    const schema: VertexSchemaDefinition = {
        attributes: [
            { type: 'float2' },
            { type: 'ubyte3', normalized: true },
            { type: 'ubyte', normalized: true },
        ],
    };
    return makePrimitive(runtime, schema, vertices.length * 16, vertices, indices);
}

function makeSoAPrimitive(
    runtime: Runtime, vertices: ReadonlyArray<Vertex>, indices: ReadonlyArray<number>,
): Primitive {
    const schema: VertexSchemaDefinition = {
        attributes: [
            { type: 'float2', offset: 16, stride: 8 },
            { type: 'ubyte3', normalized: true, offset: 0, stride: 4 },
            { type: 'ubyte', normalized: true, offset: 48, stride: 4 },
        ],
    };
    return makePrimitive(runtime, schema, 64, vertices, indices);
}

function makePrimitive(
    runtime: Runtime, vertexSchema: VertexSchemaDefinition, arrayBufferSize: number,
    vertices: ReadonlyArray<Vertex>, indices: ReadonlyArray<number>,
): Primitive {
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    const primitive = new Primitive({ runtime });

    const vertexData = new ArrayBuffer(arrayBufferSize);
    const writer = new VertexWriter(vertexSchema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, color, factor } = vertices[i];
        writer.writeAttribute(i, 0, position);
        writer.writeAttribute(i, 1, color);
        writer.writeAttribute(i, 2, factor);
    }
    const indexData = new Uint16Array(indices);

    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);

    return primitive;
}

function setup(container: HTMLElement, makePrimitive: (runtime: Runtime) => Primitive): void {
    const runtime = new Runtime({ element: container });
    const primitive = makePrimitive(runtime);
    runtime.frameRequested().on(() => {
        runtime.clearBuffer();
        primitive.render();
    });
}
