import type { Runtime, Color, Vec2, VertexSchemaInfo } from 'lib';
import {
    Primitive,
    Program,
    color,
    vec2,
    parseVertexSchema,
    writeVertexData,
} from 'lib';
import { setup } from 'playground-utils/setup';
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
    const { runtime, container } = setup();
    alignLabels(container);

    const vertices1 = makeVertices({ x: -1, y: 0 }, { x: +1, y: +1 });
    const vertices2 = makeVertices({ x: -1, y: -1 }, { x: +1, y: 0 });
    const indices = [0, 1, 2, 2, 3, 0];

    const primitiveAoS = makeAoSPrimitive(runtime, vertices1, indices);
    const primitiveSoA = makeSoAPrimitive(runtime, vertices2, indices);
    runtime.frameRequested().on(() => {
        runtime.clearBuffer();
        primitiveAoS.render();
        primitiveSoA.render();
    });
}

function makeVertices(min: Vec2, max: Vec2): Vertex[] {
    const { x: xMin, y: yMin } = min;
    const { x: xMax, y: yMax } = max;
    return [
        { position: vec2(xMin, yMin), color: color(0, 1, 0), factor: 0.3 },
        { position: vec2(xMax, yMin), color: color(0, 0, 1), factor: 0.5 },
        { position: vec2(xMax, yMax), color: color(0, 1, 0), factor: 0.7 },
        { position: vec2(xMin, yMax), color: color(0, 0, 1), factor: 0.9 },
    ];
}

function makeAoSPrimitive(
    runtime: Runtime,
    vertices: ReadonlyArray<Vertex>,
    indices: ReadonlyArray<number>,
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
    runtime: Runtime,
    vertices: ReadonlyArray<Vertex>,
    indices: ReadonlyArray<number>,
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

function alignLabels(container: HTMLElement): void {
    const { top, height } = container.getBoundingClientRect();
    const labelAoS = document.querySelector<HTMLElement>('#label-aos')!;
    const labelSoA = document.querySelector<HTMLElement>('#label-soa')!;
    const yAoS = Math.round(top);
    const ySoA = Math.round(top + height / 2);
    labelAoS.style.top = `${yAoS}px`;
    labelSoA.style.top = `${ySoA}px`;
}
