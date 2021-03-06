import {
    VertexWriter,
    parseVertexSchema,
    Runtime,
    Primitive,
    Program,
    VertexSchema,
    Color, color,
    Vec2, vec2,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

/**
 * Vertex data interleaving.
 *
 * Shows two ways of vertex layout - Array of Structure (AoS) and Structure of Arrays (SoA).
 * https://en.wikipedia.org/wiki/AoS_and_SoA
 */
export type DESCRIPTION = never;

const containerAoS = document.querySelector<HTMLElement>(PLAYGROUND_ROOT + '-aos')!;
const containerSoA = document.querySelector<HTMLElement>(PLAYGROUND_ROOT + '-soa')!;

interface Vertex {
    readonly position: Vec2;
    readonly color: Color;
    readonly factor: number;
}

const vertices: Vertex[] = [
    { position: vec2(-1, -1), color: color(0, 1, 0), factor: 0.3 },
    { position: vec2(+1, -1), color: color(0, 0, 1), factor: 0.5 },
    { position: vec2(+1, +1), color: color(0, 1, 0), factor: 0.7 },
    { position: vec2(-1, +1), color: color(0, 0, 1), factor: 0.9 },
];
const indices = [0, 1, 2, 2, 3, 0];

function makeAoSPrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
        { name: 'a_color', type: 'ubyte3', normalized: true },
        { name: 'a_factor', type: 'ubyte1', normalized: true },
    ]);
    return makePrimitive(runtime, schema, vertices.length * schema.totalSize);
}

function makeSoAPrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_color', type: 'ubyte3', normalized: true, offset: 0, stride: 4 },
        { name: 'a_position', type: 'float2', offset: 16, stride: 8 },
        { name: 'a_factor', type: 'ubyte1', normalized: true, offset: 48, stride: 4 },
    ]);
    return makePrimitive(runtime, schema, 64);
}

function makePrimitive(runtime: Runtime, schema: VertexSchema, arrayBufferSize: number): Primitive {
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive(runtime);

    const vertexData = new ArrayBuffer(arrayBufferSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, color, factor } = vertices[i];
        writer.writeAttribute(i, 'a_position', position);
        writer.writeAttribute(i, 'a_color', color);
        writer.writeAttribute(i, 'a_factor', factor);
    }

    primitive.setProgram(program);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indices.length * 2);
    primitive.updateIndexData(new Uint16Array(indices));
    primitive.setIndexCount(indices.length);

    return primitive;
}

function setup(container: HTMLElement, makePrimitive: (runtime: Runtime) => Primitive): void {
    const runtime = new Runtime(container);
    const primitive = makePrimitive(runtime);
    runtime.onRender(() => {
        runtime.clearColorBuffer();
        primitive.render();
    });
}

setup(containerAoS, makeAoSPrimitive);
setup(containerSoA, makeSoAPrimitive);
