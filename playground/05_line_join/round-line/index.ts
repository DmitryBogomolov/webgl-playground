import {
    Runtime, Primitive, Program, VertexWriter, Logger,
    parseVertexSchema,
    Vec2, Vec4, vec4,
} from 'lib';
import { Vertex } from '../vertex';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

export class RoundLine {
    private readonly _logger = new Logger('BevelLine');
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

    private _updateBuffers(vertexCount: number): void {
        let capacity = -1;
        if (vertexCount > this._capacity) {
            capacity = this._capacity > 0 ? this._capacity << 1 : 4;
        } else if (vertexCount < this._capacity / 4) {
            capacity = this._capacity > 4 ? this._capacity >> 1 : 0;
        }
        if (capacity < 0) {
            return;
        }
        this._logger.log('reallocate(vertices={0}, capacity={1})', vertexCount, capacity);
        const vertexBuffer = new ArrayBuffer(getVertexBufferSize(capacity));
        const indexBuffer = new ArrayBuffer(getIndexBufferSize(capacity));
        copyBuffer(this._vertexBuffer, vertexBuffer);
        copyBuffer(this._indexBuffer, indexBuffer);
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

    private _updateSegments(vertices: ReadonlyArray<Vertex>, vertexIdx: number): void {
        const [begin, end] = updateVertex(this._vertexBuffer, vertices, vertexIdx);
        this._primitive.updateVertexData(this._vertexBuffer.slice(begin, end), begin);
    }

    setVertices(vertices: ReadonlyArray<Vertex>): void {
        this._updateBuffers(vertices.length);
        this._writeSegments(vertices);
    }

    updateVertex(vertices: ReadonlyArray<Vertex>, vertexIdx: number): void {
        this._updateSegments(vertices, vertexIdx);
    }

    render(): void {
        this._primitive.program().setUniform('u_canvas_size', this._runtime.canvasSize());
        this._primitive.program().setUniform('u_thickness', this._runtime.toCanvasPixels(this._thickness));
        this._primitive.render();
    }
}

const schema = parseVertexSchema([
    { name: 'a_position', type: 'float4' },
    { name: 'a_other', type: 'float2' },
    { name: 'a_color', type: 'ubyte4', normalized: true },
]);

const SEGMENT_SIZE = schema.totalSize * 4;

function getVertexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 4 vertices per segment
    return vertexCount > 1 ? SEGMENT_SIZE * (vertexCount - 1) : 0;
}

function getIndexBufferSize(vertexCount: number): number {
    // segments <- vertices - 1; 6 indices per segment
    return vertexCount > 1 ? 2 * 6 * (vertexCount - 1) : 0;
}

function makePositionAttr(position: Vec2, crossSide: number, lateralSide: number): Vec4 {
    return vec4(position.x, position.y, crossSide, lateralSide);
}

function writeSegment(writer: VertexWriter, vertices: ReadonlyArray<Vertex>, idx: number): void {
    const vertexBase = idx * 4;
    const start = vertices[idx];
    const end = vertices[idx + 1];

    const startOther = end.position;
    const endOther = start.position;
    const startColor = start.color;
    const endColor = end.color;

    writer.writeAttribute(vertexBase + 0, 'a_position', makePositionAttr(start.position, +1, -1));
    writer.writeAttribute(vertexBase + 1, 'a_position', makePositionAttr(start.position, -1, -1));
    writer.writeAttribute(vertexBase + 2, 'a_position', makePositionAttr(end.position, -1, +1));
    writer.writeAttribute(vertexBase + 3, 'a_position', makePositionAttr(end.position, +1, +1));
    writer.writeAttribute(vertexBase + 0, 'a_other', startOther);
    writer.writeAttribute(vertexBase + 1, 'a_other', startOther);
    writer.writeAttribute(vertexBase + 2, 'a_other', endOther);
    writer.writeAttribute(vertexBase + 3, 'a_other', endOther);
    writer.writeAttribute(vertexBase + 0, 'a_color', startColor);
    writer.writeAttribute(vertexBase + 1, 'a_color', startColor);
    writer.writeAttribute(vertexBase + 2, 'a_color', endColor);
    writer.writeAttribute(vertexBase + 3, 'a_color', endColor);
}

function writeVertices(vertexData: ArrayBuffer, vertices: ReadonlyArray<Vertex>): void {
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length - 1; ++i) {
        writeSegment(writer, vertices, i);
    }
}

function updateVertex(vertexData: ArrayBuffer, vertices: ReadonlyArray<Vertex>, vertexIdx: number): [number, number] {
    const writer = new VertexWriter(schema, vertexData);
    const beginSegmentIdx = Math.max(vertexIdx - 2, 0);
    const endSegmentIdx = Math.min(vertexIdx + 1, vertices.length - 2);
    for (let i = beginSegmentIdx; i <= endSegmentIdx; ++i) {
        writeSegment(writer, vertices, i);
    }
    return [SEGMENT_SIZE * beginSegmentIdx, SEGMENT_SIZE * (endSegmentIdx + 1)];
}

function writeIndexes(indexData: ArrayBuffer, vertexCount: number): void {
    const arr = new Uint16Array(indexData);
    for (let i = 0; i < vertexCount - 1; ++i) {
        writeSegmentIndexes(arr, i * 6, i * 4);
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

function copyBuffer(src: ArrayBuffer, dst: ArrayBuffer): void {
    const srcArr = new Uint8Array(src, 0, Math.min(src.byteLength, dst.byteLength));
    const dstArr = new Uint8Array(dst);
    dstArr.set(srcArr);
}
