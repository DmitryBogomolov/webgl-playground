import {
    parseVertexSchema,
    Primitive,
    Program,
    Runtime,
    Color, colors, color2array,
    VertexWriter, AttrValue,
} from 'lib';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

const container = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT)!;

interface Vertex {
    readonly position: Position;
    readonly color: Color;
}

interface Position {
    readonly x: number;
    readonly y: number;
}

const enum Location {
    L = -1,
    R = +1,
}

function makePositionAttr(position: Position, location: Location): AttrValue {
    return [position.x, position.y, location];
}

function makeOtherAttr(other: Position, outer: Position): AttrValue {
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

    const vertices: Vertex[] = [
        { position: { x: -0.7, y: -0.8 }, color: colors.BLUE },
        { position: { x: -0.1, y: +0.5 }, color: colors.GREEN },
        { position: { x: +0.4, y: -0.5 }, color: colors.RED },
        { position: { x: +0.8, y: +0.6 }, color: colors.GREEN },
    ];
    const segmentCount = vertices.length - 1;
    const vertexData = new ArrayBuffer(schema.totalSize * segmentCount * 4);
    const writer = new VertexWriter(schema, vertexData);
    const indexData = new Uint16Array(6 * (2 * segmentCount - 1));
    let indexBase = 0;
    for (let i = 0; i < segmentCount; ++i) {
        const vertexBase = i * 4;
        const start = vertices[i];
        const end = vertices[i + 1];
        const before = i > 0 ? vertices[i - 1] : end;
        const after = i < segmentCount - 1 ? vertices[i + 2] : start;

        writer.writeAttribute(vertexBase + 0, 'a_position', makePositionAttr(start.position, Location.R));
        writer.writeAttribute(vertexBase + 1, 'a_position', makePositionAttr(start.position, Location.L));
        writer.writeAttribute(vertexBase + 2, 'a_position', makePositionAttr(end.position, Location.L));
        writer.writeAttribute(vertexBase + 3, 'a_position', makePositionAttr(end.position, Location.R));
        writer.writeAttribute(vertexBase + 0, 'a_other', makeOtherAttr(end.position, before.position));
        writer.writeAttribute(vertexBase + 1, 'a_other', makeOtherAttr(end.position, before.position));
        writer.writeAttribute(vertexBase + 2, 'a_other', makeOtherAttr(start.position, after.position));
        writer.writeAttribute(vertexBase + 3, 'a_other', makeOtherAttr(start.position, after.position));
        writer.writeAttribute(vertexBase + 0, 'a_color', color2array(start.color));
        writer.writeAttribute(vertexBase + 1, 'a_color', color2array(start.color));
        writer.writeAttribute(vertexBase + 2, 'a_color', color2array(end.color));
        writer.writeAttribute(vertexBase + 3, 'a_color', color2array(end.color));

        indexData[indexBase++] = vertexBase + 0;
        indexData[indexBase++] = vertexBase + 1;
        indexData[indexBase++] = vertexBase + 3;
        indexData[indexBase++] = vertexBase + 3;
        indexData[indexBase++] = vertexBase + 2;
        indexData[indexBase++] = vertexBase + 0;

        if (i < segmentCount - 1) {
            indexData[indexBase++] = vertexBase + 2;
            indexData[indexBase++] = vertexBase + 3;
            indexData[indexBase++] = vertexBase + 5;
            indexData[indexBase++] = vertexBase + 5;
            indexData[indexBase++] = vertexBase + 4;
            indexData[indexBase++] = vertexBase + 2;
        }
    }

    primitive.setProgram(program);
    primitive.setData(vertexData, indexData);

    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);
runtime.onRender(() => {
    runtime.clearColor();
    primitive.draw({
        'u_canvas_size': [runtime.gl.canvas.width, runtime.gl.canvas.height],
        'u_thickness': 50.0,
    });
});
