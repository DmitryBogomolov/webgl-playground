import {
    parseVertexSchema,
    Primitive,
    Program, UniformValue,
    Runtime,
    Color, color, color2arr,
    VertexWriter, AttrValue, VertexSchema,
    memoize,
    makeEventCoordsGetter,
    Vec2, vec2, dist2, pointToLineDistance2,
} from 'lib';
import { Vertex, findNearestVertex, pickOtherVertex } from './utils';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

/**
 * Bevel line join.
 */
export type DESCRIPTION = never;

// TODO:
// - fix small angles issue
// - add index writer
// - provide round join
// - use kd tree
// - add buffers reallocation

const container = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT)!;

const enum Location {
    L = -1,
    R = +1,
}

const pickColor = (function () {
    const colorPool: ReadonlyArray<Color> = [
        color(0, 0, 1),
        color(0, 1, 0),
        color(0, 1, 1),
        color(1, 0, 0),
        color(1, 0, 1),
        color(1, 1, 0),
    ];
    let next = 0;

    function pick(): Color {
        const idx = next;
        next = (next + 1) % colorPool.length;
        return colorPool[idx];
    }

    return pick;
}());

const vertices: Vertex[] = [
    { position: vec2(-0.7, -0.8), color: pickColor() },
    { position: vec2(-0.1, +0.5), color: pickColor() },
    { position: vec2(+0.4, -0.5), color: pickColor() },
    { position: vec2(+0.8, +0.6), color: pickColor() },
];

function makePositionAttr(position: Vec2, location: Location): AttrValue {
    return [position.x, position.y, location];
}

function makeOtherAttr(other: Vec2, outer: Vec2): AttrValue {
    return [other.x, other.y, outer.x, outer.y];
}

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float3' },
    { name: 'a_other', type: 'float4' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

function getVertexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 4 vertexes per segment
    return schema.totalSize * (vertexCount - 1) * 4;
}

function getIndexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 6 indices per segment and 6 indices per segment join
    return 6 * (2 * (vertexCount - 1) - 1);
}

const vertexData = new ArrayBuffer(getVertexBufferSize(vertices.length));
const indexData = new Uint16Array(getIndexBufferSize(vertices.length));

function makePrimitive(runtime: Runtime, primitive: Primitive): Primitive {
    //const primitive = new Primitive(runtime);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    writeVertices(vertexData, schema, vertices);
    writeIndexes(indexData, vertices.length);

    primitive.setProgram(program);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setIndexCount(indexData.length);

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

let thickness = 50;

const runtime = new Runtime(container);
const primitive = new Primitive(runtime);
makePrimitive(runtime, primitive);
runtime.onRender(() => {
    runtime.clearColorBuffer();
    primitive.render({
        'u_canvas_size': makeSizeUniform(runtime.canvasSize()),
        'u_thickness': runtime.toCanvasPixels(thickness),
    });
});

container.addEventListener('pointerdown', handleDown);

const getEventCoord = makeEventCoordsGetter(container);

function ndc2px(ndc: Vec2): Vec2 {
    return runtime.ndc2px(ndc);
}

let targetVertexIdx: number = -1;
let targetSegmentIdx: number = -1;

const VERTEX_THRESHOLD = 16;
const BORDER_THRESHOLD = 8;

document.addEventListener('dblclick', (e: MouseEvent) => {
    e.preventDefault();
    const coords = getEventCoord(e);
    const vertexIdx = findNearestVertex(vertices, coords, ndc2px);
    const vertexCoords = ndc2px(vertices[vertexIdx].position);
    const dist = dist2(vertexCoords, coords);
    if (dist <= VERTEX_THRESHOLD) {
        if (vertices.length <= 2) {
            return;
        }
        vertices.splice(vertexIdx, 1);
        writeVertices(vertexData, schema, vertices);
        writeIndexes(indexData, vertices.length);
        primitive.updateVertexData(vertexData);
        primitive.updateIndexData(indexData);
        primitive.setIndexCount(getIndexBufferSize(vertices.length));
        runtime.requestRender();
    } else {
        vertices.push({ position: runtime.px2ndc(coords), color: pickColor() });
        writeVertices(vertexData, schema, vertices);
        writeIndexes(indexData, vertices.length);
        primitive.updateVertexData(vertexData);
        primitive.updateIndexData(indexData);
        primitive.setIndexCount(getIndexBufferSize(vertices.length));
        runtime.requestRender();
    }
});

function handleDown(e: PointerEvent): void {
    e.preventDefault();
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);

    const coords = getEventCoord(e);
    const vertexIdx = findNearestVertex(vertices, coords, ndc2px);
    const vertexCoords = ndc2px(vertices[vertexIdx].position);
    const dist = dist2(vertexCoords, coords);
    if (dist <= VERTEX_THRESHOLD) {
        targetVertexIdx = vertexIdx;
    } else {
        const otherIdx = pickOtherVertex(vertices, coords, vertexIdx, ndc2px);
        const otherCoords = ndc2px(vertices[otherIdx].position);
        const dist = pointToLineDistance2(coords, vertexCoords, otherCoords);
        if (Math.abs(dist - thickness / 2) <= BORDER_THRESHOLD) {
            targetSegmentIdx = Math.min(vertexIdx, otherIdx);
        }
    }
}

function handleMove(e: PointerEvent): void {
    const coords = getEventCoord(e);

    if (targetVertexIdx >= 0) {
        vertices[targetVertexIdx].position = runtime.px2ndc(coords);
        writeVertices(vertexData, schema, vertices);
        primitive.updateVertexData(vertexData);
        runtime.requestRender();
    } else if (targetSegmentIdx >= 0) {
        const v1 = ndc2px(vertices[targetSegmentIdx + 0].position);
        const v2 = ndc2px(vertices[targetSegmentIdx + 1].position);
        const dist = pointToLineDistance2(coords, v1, v2);
        thickness = dist * 2;
        runtime.requestRender();
    }
}

function handleUp(_e: PointerEvent): void {
    document.removeEventListener('pointermove', handleMove);
    document.removeEventListener('pointerup', handleUp);
    document.removeEventListener('pointercancel', handleUp);

    targetVertexIdx = -1;
    targetSegmentIdx = -1;
}
