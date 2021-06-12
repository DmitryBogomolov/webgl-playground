import {
    parseVertexSchema,
    Primitive,
    Program, UniformValue,
    Runtime,
    Color, colors, color2arr,
    VertexWriter, AttrValue, VertexSchema,
    memoize,
    Vec2, vec2,
} from 'lib';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

/**
 * Bevel line join.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT)!;

interface Vertex {
    readonly position: Vec2;
    readonly color: Color;
}

const enum Location {
    L = -1,
    R = +1,
}

const vertices: Vertex[] = [
    { position: vec2(-0.7, -0.8), color: colors.BLUE },
    { position: vec2(-0.1, +0.5), color: colors.GREEN },
    { position: vec2(+0.4, -0.5), color: colors.RED },
    { position: vec2(+0.8, +0.6), color: colors.GREEN },
];

function makePositionAttr(position: Vec2, location: Location): AttrValue {
    return [position.x, position.y, location];
}

function makeOtherAttr(other: Vec2, outer: Vec2): AttrValue {
    return [other.x, other.y, outer.x, outer.y];
}

function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_other', type: 'float4' },
        { name: 'a_color', type: 'ubyte4', normalized: true },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const vertexData = new ArrayBuffer(schema.totalSize * (vertices.length - 1) * 4);
    const indexData = new Uint16Array(6 * (2 * (vertices.length - 1) - 1));
    writeVertices(vertexData, schema, vertices);
    writeIndexes(indexData, vertices.length);

    primitive.setProgram(program);
    primitive.setData(vertexData, indexData);

    return primitive;
}

function writeVertices(vertexData: ArrayBuffer, schema: VertexSchema, vertices: ReadonlyArray<Vertex>): void {
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length - 1; ++i) {
        const vertexBase = i * 4;
        const start = vertices[i];
        const end = vertices[i + 1];
        const before = vertices[i - 1] || end;
        const after = vertices[i + 2] || start;

        const startOther = makeOtherAttr(end.position, before.position);
        const endOther = makeOtherAttr(start.position, after.position);
        const startColor = color2arr(start.color);
        const endColor = color2arr(end.color);

        writer.writeAttribute(vertexBase + 0, 'a_position', makePositionAttr(start.position, Location.R));
        writer.writeAttribute(vertexBase + 1, 'a_position', makePositionAttr(start.position, Location.L));
        writer.writeAttribute(vertexBase + 2, 'a_position', makePositionAttr(end.position, Location.L));
        writer.writeAttribute(vertexBase + 3, 'a_position', makePositionAttr(end.position, Location.R));
        writer.writeAttribute(vertexBase + 0, 'a_other', startOther);
        writer.writeAttribute(vertexBase + 1, 'a_other', startOther);
        writer.writeAttribute(vertexBase + 2, 'a_other', endOther);
        writer.writeAttribute(vertexBase + 3, 'a_other', endOther);
        writer.writeAttribute(vertexBase + 0, 'a_color', startColor);
        writer.writeAttribute(vertexBase + 1, 'a_color', startColor);
        writer.writeAttribute(vertexBase + 2, 'a_color', endColor);
        writer.writeAttribute(vertexBase + 3, 'a_color', endColor);
    }
}

function writeIndexes(indexData: Uint16Array, vertexCount: number): void {
    for (let i = 0; i < vertexCount - 1; ++i) {
        writeSegmentIndexes(indexData, i * 12, i * 4);
    }
    for (let i = 0; i < vertexCount - 2; ++i) {
        writeSegmentIndexes(indexData, i * 12 + 6, i * 4 + 2);
    }
}

function writeSegmentIndexes(indexData: Uint16Array, offset: number, vertexIndex: number): void {
    indexData[offset + 0] = vertexIndex + 0;
    indexData[offset + 1] = vertexIndex + 1;
    indexData[offset + 2] = vertexIndex + 3;
    indexData[offset + 3] = vertexIndex + 3;
    indexData[offset + 4] = vertexIndex + 2;
    indexData[offset + 5] = vertexIndex + 0;
}

const makeSizeUniform = memoize(({ x, y }: Vec2): UniformValue => ([x, y]));

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);
runtime.onRender(() => {
    runtime.clearColor();
    primitive.render({
        'u_canvas_size': makeSizeUniform(runtime.getCanvasSize()),
        'u_thickness': runtime.toCanvasPixels(50),
    });
});