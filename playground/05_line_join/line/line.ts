import { LoggerImpl, Runtime, Primitive, Program, VertexWriter, VertexSchema } from 'lib';
import { Vertex } from '../vertex';

export interface LineParams {
    readonly schema: VertexSchema;
    readonly vertShader: string;
    readonly fragShader: string;
    getVertexCount(segmentCount: number): number;
    getIndexCount(segmentCount: number): number;
    writeSegmentVertices(writer: VertexWriter, vertices: ReadonlyArray<Vertex>, segmentIdx: number): void;
    writeSegmentIndexes(arr: Uint16Array, vertexCount: number, segmentIdx: number): void;
    getSegmentRange(vertexCount: number, vertexIdx: number): [number, number];
}

export class Line {
    private readonly _logger = new LoggerImpl(this.constructor.name);
    private _thickness = 1;
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _params: LineParams;
    private _capacity = 0;
    private _vertexBuffer = new ArrayBuffer(0);
    private _indexBuffer = new ArrayBuffer(0);

    constructor(runtime: Runtime, params: LineParams) {
        this._runtime = runtime;
        this._params = params;
        this._primitive = new Primitive(runtime);
        const program = new Program(runtime, {
            vertShader: params.vertShader,
            fragShader: params.fragShader,
            schema: params.schema,
        });
        this._primitive.allocateVertexBuffer(this._vertexBuffer.byteLength);
        this._primitive.allocateIndexBuffer(this._indexBuffer.byteLength);
        this._primitive.setVertexSchema(params.schema);
        this._primitive.setProgram(program);
    }

    dispose(): void {
        this._primitive.program().dispose();
        this._primitive.dispose();
    }

    setThickness(thickness: number): void {
        this._thickness = thickness;
    }

    private _getVertexBufferSize(vertexCount: number): number {
        return vertexCount > 1 ? this._params.schema.totalSize * this._params.getVertexCount(vertexCount - 1) : 0;
    }

    private _getIndexBufferSize(vertexCount: number): number {
        return vertexCount > 1 ? 2 * this._params.getIndexCount(vertexCount - 1) : 0;
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
        const vertexBuffer = new ArrayBuffer(this._getVertexBufferSize(capacity));
        const indexBuffer = new ArrayBuffer(this._getIndexBufferSize(capacity));
        copyBuffer(this._vertexBuffer, vertexBuffer);
        copyBuffer(this._indexBuffer, indexBuffer);
        this._vertexBuffer = vertexBuffer;
        this._indexBuffer = indexBuffer;
        this._capacity = capacity;
        this._primitive.allocateVertexBuffer(this._vertexBuffer.byteLength);
        this._primitive.allocateIndexBuffer(this._indexBuffer.byteLength);
    }

    private _writeVertices(vertices: ReadonlyArray<Vertex>): void {
        const writer = new VertexWriter(this._params.schema, this._vertexBuffer);
        for (let i = 0; i < vertices.length - 1; ++i) {
            this._params.writeSegmentVertices(writer, vertices, i);
        }
    }

    private _writeIndexes(vertexCount: number): void {
        const arr = new Uint16Array(this._indexBuffer);
        for (let i = 0; i < vertexCount - 1; ++i) {
            this._params.writeSegmentIndexes(arr, vertexCount, i);
        }
    }

    private _writeSegments(vertices: ReadonlyArray<Vertex>): void {
        const vertexCount = vertices.length;
        this._writeVertices(vertices);
        this._writeIndexes(vertexCount);
        const vertexDataSize = this._getVertexBufferSize(vertexCount);
        const indexDataSize = this._getIndexBufferSize(vertexCount);
        this._primitive.updateVertexData(this._vertexBuffer.slice(0, vertexDataSize));
        this._primitive.updateIndexData(this._indexBuffer.slice(0, indexDataSize));
        this._primitive.setIndexData({ indexCount: indexDataSize / 2 });
    }

    private _updateSegments(vertices: ReadonlyArray<Vertex>, vertexIdx: number): void {
        const writer = new VertexWriter(this._params.schema, this._vertexBuffer);
        const [beginSegmentIdx, endSegmentIdx] = this._params.getSegmentRange(vertices.length, vertexIdx);
        for (let i = beginSegmentIdx; i <= endSegmentIdx; ++i) {
            this._params.writeSegmentVertices(writer, vertices, i);
        }
        const beginOffset = this._getVertexBufferSize(beginSegmentIdx + 1);
        const endOffset = this._getVertexBufferSize(endSegmentIdx + 2);
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
