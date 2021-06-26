import {
    Runtime, Primitive, Program, VertexWriter, Logger,
    Vec2, UniformValue, AttrValue,
    parseVertexSchema, memoize, color2arr,
} from 'lib';
import { Vertex } from './vertex';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

export class Line {
    private readonly _logger = new Logger('Line');
    private _thickness = 1;
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private _capacity = 0;
    private _vertexBuffer = new ArrayBuffer(0);
    private _indexBuffer = new ArrayBuffer(0);

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

    setThickness(thickness: number): void {
        this._thickness = thickness;
    }

    private _updateBuffers(capacity: number): void {
        this._logger.log('reallocate: {0}', capacity);
        const vertexBuffer = new ArrayBuffer(getVertexBufferSize(capacity));
        const indexBuffer = new ArrayBuffer(getIndexBufferSize(capacity));
        copyBuffer(this._vertexBuffer, vertexBuffer, Math.min(this._vertexBuffer.byteLength, vertexBuffer.byteLength));
        copyBuffer(this._indexBuffer, indexBuffer, Math.min(this._indexBuffer.byteLength, indexBuffer.byteLength));
        this._vertexBuffer = vertexBuffer;
        this._indexBuffer = indexBuffer;
        this._capacity = capacity;
        this._primitive.allocateVertexBuffer(this._vertexBuffer.byteLength);
        this._primitive.allocateIndexBuffer(this._indexBuffer.byteLength);
    }

    private _writeSegments(vertices: ReadonlyArray<Vertex>): void {
        const vertexCount = vertices.length;
        writeVertices(this._vertexBuffer, vertices);
        writeIndexes(this._indexBuffer, vertexCount);
        const vertexDataSize = getVertexBufferSize(vertexCount);
        const indexDataSize = getIndexBufferSize(vertexCount);
        this._primitive.updateVertexData(this._vertexBuffer.slice(0, vertexDataSize));
        this._primitive.updateIndexData(this._indexBuffer.slice(0, indexDataSize));
        this._primitive.setIndexCount(indexDataSize / 2);
    }

    setVertices(vertices: ReadonlyArray<Vertex>): void {
        let capacity = -1;
        const vertexCount = vertices.length;
        if (vertexCount > this._capacity) {
            capacity = this._capacity > 0 ? this._capacity << 1 : 4;
        } else if (vertexCount < this._capacity / 4) {
            capacity = this._capacity > 4 ? this._capacity >> 1 : 0;
        }
        if (capacity >= 0) {
            this._updateBuffers(capacity);
        }
        this._writeSegments(vertices);
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
    return vertexCount > 1 ? schema.totalSize * (vertexCount - 1) * 4 : 0;
}

function getIndexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 6 indices per segment and 6 indices per segment join
    return vertexCount > 1 ? 2 * 6 * (2 * (vertexCount - 1) - 1) : 0;
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

function copyBuffer(src: ArrayBuffer, dst: ArrayBuffer, byteLength: number): void {
    const srcArr = new Uint8Array(src, 0, byteLength);
    const dstArr = new Uint8Array(dst);
    dstArr.set(srcArr);
}
