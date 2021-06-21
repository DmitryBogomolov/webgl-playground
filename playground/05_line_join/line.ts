import {
    Runtime, Primitive, Program, VertexWriter,
    Vec2, UniformValue, AttrValue,
    parseVertexSchema, memoize, color2arr,
} from 'lib';
import { Vertex } from './vertex';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

export class Line {
    private readonly _vertices: Vertex[] = [];
    private _thickness: number = 1;
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _vertexBuffer = new ArrayBuffer(getVertexBufferSize(4));
    private readonly _indexBuffer = new ArrayBuffer(getIndexBufferSize(4));

    constructor(runtime: Runtime) {
        this._runtime = runtime;
        this._primitive = new Primitive(runtime);
        const program = new Program(runtime, {
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            schema,
        });
        this._primitive.setProgram(program);
        this._primitive.allocateVertexBuffer(this._vertexBuffer.byteLength);
        this._primitive.allocateIndexBuffer(this._indexBuffer.byteLength);
    }

    dispose(): void {
        this._primitive.dispose();
    }

    length(): number {
        return this._vertices.length;
    }

    setThickness(thickness: number): void {
        this._thickness = thickness;
    }

    addVertex(index: number, vertex: Vertex): void {
        this._vertices.splice(index, 0, { ...vertex });
        writeVertices(this._vertexBuffer, this._vertices);
        writeIndexes(this._indexBuffer, this._vertices.length);
        this._primitive.updateVertexData(this._vertexBuffer);
        this._primitive.updateIndexData(this._indexBuffer);
        this._primitive.setIndexCount(getIndexBufferSize(this._vertices.length) / 2);
    }

    removeVertex(index: number): void {
        this._vertices.splice(index, 1);
        writeVertices(this._vertexBuffer, this._vertices);
        writeIndexes(this._indexBuffer, this._vertices.length);
        this._primitive.updateVertexData(this._vertexBuffer);
        this._primitive.updateIndexData(this._indexBuffer);
        this._primitive.setIndexCount(getIndexBufferSize(this._vertices.length) / 2);
    }

    updateVertex(index: number, vertex: Vertex): void {
        this._vertices[index] = vertex;
        writeVertices(this._vertexBuffer, this._vertices);
        writeIndexes(this._indexBuffer, this._vertices.length);
        this._primitive.updateVertexData(this._vertexBuffer);
        this._primitive.updateIndexData(this._indexBuffer);
        this._primitive.setIndexCount(getIndexBufferSize(this._vertices.length) / 2);
    }

    render(): void {
        this._primitive.render({
            'u_canvas_size': makeSizeUniform(this._runtime.canvasSize()),
            'u_thickness': this._runtime.toCanvasPixels(this._thickness),
        });
    }
}

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float3' },
    { name: 'a_other', type: 'float4' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

const makeSizeUniform = memoize(({ x, y }: Vec2): UniformValue => ([x, y]));

function getVertexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 4 vertices per segment
    return vertexCount > 0 ? schema.totalSize * (vertexCount - 1) * 4 : 0;
}

function getIndexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 6 indices per segment and 6 indices per segment join
    return vertexCount > 0 ? 2 * 6 * (2 * (vertexCount - 1) - 1) : 0;
}

const enum Location {
    L = -1,
    R = +1,
}

function makePositionAttr(position: Vec2, location: Location): AttrValue {
    return [position.x, position.y, location];
}

function makeOtherAttr(other: Vec2, outer: Vec2): AttrValue {
    return [other.x, other.y, outer.x, outer.y];
}

function writeVertices(vertexData: ArrayBuffer, vertices: ReadonlyArray<Vertex>): void {
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

function writeIndexes(indexData: ArrayBuffer, vertexCount: number): void {
    const arr = new Uint16Array(indexData);
    for (let i = 0; i < vertexCount - 1; ++i) {
        writeSegmentIndexes(arr, i * 12, i * 4);
    }
    for (let i = 0; i < vertexCount - 2; ++i) {
        writeSegmentIndexes(arr, i * 12 + 6, i * 4 + 2);
    }
}

function writeSegmentIndexes(arr: Uint16Array, offset: number, vertexIndex: number): void {
    arr[offset + 0] = vertexIndex + 0;
    arr[offset + 1] = vertexIndex + 1;
    arr[offset + 2] = vertexIndex + 3;
    arr[offset + 3] = vertexIndex + 3;
    arr[offset + 4] = vertexIndex + 2;
    arr[offset + 5] = vertexIndex + 0;
}
