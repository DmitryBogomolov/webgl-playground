import {
    parseVertexSchema,
    Primitive,
    Program,
    Runtime,
    VertexWriter, AttrValue,
} from 'lib';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

const container = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT)!;

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
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const vertices: Position[] = [
        { x: -0.7, y: -0.8 },
        { x: -0.1, y: +0.5 },
        { x: +0.4, y: -0.5 },
        { x: +0.8, y: +0.6 },
    ];
    const segmentCount = vertices.length - 1;
    const vertexData = new ArrayBuffer(schema.totalSize * segmentCount * 4);
    const writer = new VertexWriter(schema, vertexData);
    const indexData = new Uint16Array(6 * segmentCount);
    for (let i = 0; i < segmentCount; ++i) {
        const vertexBase = i * 4;
        const indexBase = i * 6;
        const start = vertices[i];
        const end = vertices[i + 1];
        const before = i > 0 ? vertices[i - 1] : end;
        const after = i < segmentCount - 1 ? vertices[i + 2] : start;

        writer.writeAttribute(vertexBase + 0, 'a_position', makePositionAttr(start, Location.R));
        writer.writeAttribute(vertexBase + 1, 'a_position', makePositionAttr(start, Location.L));
        writer.writeAttribute(vertexBase + 2, 'a_position', makePositionAttr(end, Location.L));
        writer.writeAttribute(vertexBase + 3, 'a_position', makePositionAttr(end, Location.R));
        writer.writeAttribute(vertexBase + 0, 'a_other', makeOtherAttr(end, before));
        writer.writeAttribute(vertexBase + 1, 'a_other', makeOtherAttr(end, before));
        writer.writeAttribute(vertexBase + 2, 'a_other', makeOtherAttr(start, after));
        writer.writeAttribute(vertexBase + 3, 'a_other', makeOtherAttr(start, after));

        indexData[indexBase + 0] = vertexBase + 0;
        indexData[indexBase + 1] = vertexBase + 1;
        indexData[indexBase + 2] = vertexBase + 3;
        indexData[indexBase + 3] = vertexBase + 3;
        indexData[indexBase + 4] = vertexBase + 2;
        indexData[indexBase + 5] = vertexBase + 0;
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
