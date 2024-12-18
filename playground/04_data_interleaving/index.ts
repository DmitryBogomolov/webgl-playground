import type { Color, Vec2, VertexSchemaInfo } from 'lib';
import {
    Runtime,
    Primitive,
    Program,
    color,
    vec2,
    parseVertexSchema,
    writeVertexData,
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
    const schema = parseVertexSchema({
        attributes: [
            { type: 'float2' },
            { type: 'ubyte3', normalized: true },
            { type: 'ubyte', normalized: true },
        ],
    });
    return makePrimitive(runtime, schema, vertices, indices);
}

function makeSoAPrimitive(
    runtime: Runtime, vertices: ReadonlyArray<Vertex>, indices: ReadonlyArray<number>,
): Primitive {
    const schema = parseVertexSchema({
        attributes: [
            { type: 'float2', offset: 16, stride: 8 },
            { type: 'ubyte3', normalized: true, offset: 0, stride: 4 },
            { type: 'ubyte', normalized: true, offset: 48, stride: 4 },
        ],
    });
    return makePrimitive(runtime, schema, vertices, indices);
}

function makePrimitive(
    runtime: Runtime,
    vertexSchema: VertexSchemaInfo,
    vertices: ReadonlyArray<Vertex>,
    indices: ReadonlyArray<number>,
): Primitive {
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    const primitive = new Primitive({ runtime });

    const vertexData = writeVertexData(
        vertices,
        vertexSchema,
        (vertex) => ([vertex.position, vertex.color, vertex.factor]),
    );
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
