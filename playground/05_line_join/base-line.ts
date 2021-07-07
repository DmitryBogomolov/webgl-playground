import { Logger, Runtime, Primitive, Program, VertexWriter, VertexSchema } from 'lib';
import { Vertex } from './vertex';

export abstract class BaseLine {
    private readonly _logger = new Logger(this.constructor.name);
    private _thickness = 1;
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _schema: VertexSchema;
    private readonly _segmentSize: number;
    private _capacity = 0;
    private _vertexBuffer = new ArrayBuffer(0);
    private _indexBuffer = new ArrayBuffer(0);

    constructor(runtime: Runtime, schema: VertexSchema, vertexShaderSource: string, fragmentShaderSource: string) {
        this._runtime = runtime;
        this._primitive = new Primitive(runtime);
        this._schema = schema;
        // Segment consists of 4 points.
        this._segmentSize = schema.totalSize * 4;
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
        this._primitive.program().dispose();
        this._primitive.dispose();
    }

    setThickness(thickness: number): void {
        this._thickness = thickness;
    }

    protected abstract _getVertexBufferSize(segmentSize: number, capacity: number): number;
    protected abstract _getIndexBufferSize(capacity: number): number;

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
        const vertexBuffer = new ArrayBuffer(this._getVertexBufferSize(this._segmentSize, capacity));
        const indexBuffer = new ArrayBuffer(this._getIndexBufferSize(capacity));
        copyBuffer(this._vertexBuffer, vertexBuffer);
        copyBuffer(this._indexBuffer, indexBuffer);
        this._vertexBuffer = vertexBuffer;
        this._indexBuffer = indexBuffer;
        this._capacity = capacity;
        this._primitive.allocateVertexBuffer(this._vertexBuffer.byteLength);
        this._primitive.allocateIndexBuffer(this._indexBuffer.byteLength);
    }

    protected abstract _writeSegmentVertices(
        writer: VertexWriter, vertices: ReadonlyArray<Vertex>, idx: number
    ): void;

    private _writeVertices(vertices: ReadonlyArray<Vertex>): void {
        const writer = new VertexWriter(this._schema, this._vertexBuffer);
        for (let i = 0; i < vertices.length - 1; ++i) {
            this._writeSegmentVertices(writer, vertices, i);
        }
    }

    protected abstract _writeSegmentIndexes(
        arr: Uint16Array, vertexCount: number, idx: number,
    ): void;

    private _writeIndexes(vertexCount: number): void {
        const arr = new Uint16Array(this._indexBuffer);
        for (let i = 0; i < vertexCount - 1; ++i) {
            this._writeSegmentIndexes(arr, vertexCount, i);
        }
    }

    private _writeSegments(vertices: ReadonlyArray<Vertex>): void {
        const vertexCount = vertices.length;
        this._writeVertices(vertices);
        this._writeIndexes(vertexCount);
        const vertexDataSize = this._getVertexBufferSize(this._segmentSize, vertexCount);
        const indexDataSize = this._getIndexBufferSize(vertexCount);
        this._primitive.updateVertexData(this._vertexBuffer.slice(0, vertexDataSize));
        this._primitive.updateIndexData(this._indexBuffer.slice(0, indexDataSize));
        this._primitive.setIndexCount(indexDataSize / 2);
    }

    protected abstract _getSegmentRange(vertexCount: number, vertexIdx: number): [number, number];

    private _updateSegments(vertices: ReadonlyArray<Vertex>, vertexIdx: number): void {
        const writer = new VertexWriter(this._schema, this._vertexBuffer);
        const [beginSegmentIdx, endSegmentIdx] = this._getSegmentRange(vertices.length, vertexIdx);
        for (let i = beginSegmentIdx; i <= endSegmentIdx; ++i) {
            this._writeSegmentVertices(writer, vertices, i);
        }
        const beginOffset = beginSegmentIdx * this._segmentSize;
        const endOffset = (endSegmentIdx + 1) * this._segmentSize;
        this._primitive.updateVertexData(this._vertexBuffer.slice(beginOffset, endOffset), beginOffset);
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

function copyBuffer(src: ArrayBuffer, dst: ArrayBuffer): void {
    const srcArr = new Uint8Array(src, 0, Math.min(src.byteLength, dst.byteLength));
    const dstArr = new Uint8Array(dst);
    dstArr.set(srcArr);
}

export function writeSegmentIndexes(arr: Uint16Array, offset: number, vertexIndex: number): void {
    arr[offset + 0] = vertexIndex + 0;
    arr[offset + 1] = vertexIndex + 1;
    arr[offset + 2] = vertexIndex + 3;
    arr[offset + 3] = vertexIndex + 3;
    arr[offset + 4] = vertexIndex + 2;
    arr[offset + 5] = vertexIndex + 0;
}
