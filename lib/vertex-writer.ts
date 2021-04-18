import { Logger, raiseError, generateId } from './utils';
import { MetaDesc, VertexSchema } from './vertex-schema';

type Normalizer = (value: number) => number;

const normalizers: Record<string, Normalizer> = {
    byte: (value) => Math.round(value * 0x7F),
    ubyte: (value) => Math.round(value * 0xFF),
    short: (value) => Math.round(value * 0x7FFF),
    ushort: (value) => Math.round(value * 0xFFFF),
};

function eigen<T>(value: T): T {
    return value;
}

type FieldMap = Record<string, MetaDesc>;

function buildMap(schema: VertexSchema): FieldMap {
    const result: Record<string, MetaDesc> = {};
    schema.items.forEach((meta) => {
        result[meta.name] = meta;
    });
    return result;
}

export interface ArrayBufferSite {
    readonly buffer: ArrayBuffer;
    readonly offset: number;
    readonly length: number;
}

type VertexWriterSource = ArrayBuffer | ArrayBufferSite;

function wrapBuffer(buffer: VertexWriterSource): ArrayBufferSite {
    return buffer instanceof ArrayBuffer ? { buffer, offset: 0, length: buffer.byteLength } : buffer;
}

abstract class BaseVertexWriter<T = never> {
    protected readonly _logger: Logger;
    protected readonly _schema: VertexSchema;
    protected readonly _byName: FieldMap;
    protected readonly _impl: Record<string, T> = {};

    constructor(_source: VertexWriterSource, schema: VertexSchema) {
        this._logger = new Logger(generateId('VertexWriter'));
        this._schema = schema;
        this._byName = buildMap(schema);
    }

    private _getPosition(vertexIndex: number, meta: MetaDesc): number {
        return this._schema.vertexSize * vertexIndex + meta.offset;
    }

    schema(): VertexSchema {
        return this._schema;
    }

    protected abstract _write(impl: T, position: number, i: number, meta: MetaDesc, value: number): void;

    writeField(vertexIndex: number, fieldName: string, value: number[]): void {
        const meta = this._byName[fieldName];
        const position = this._getPosition(vertexIndex, meta);
        const normalize = meta.normalized ? normalizers[meta.type] : eigen;
        const impl = this._impl[meta.type];
        for (let i = 0; i < meta.size; ++i) {
            this._write(impl, position, i, meta, normalize(value[i]));
        }
    }
}

type DataViewCaller = (dv: DataView, offset: number, value: number) => void;

const dataViewCallers: Record<string, DataViewCaller> = {
    byte: (dv, offset, value) => dv.setInt8(offset, value),
    ubyte: (dv, offset, value) => dv.setUint8(offset, value),
    short: (dv, offset, value) => dv.setInt16(offset, value, true),
    ushort: (dv, offset, value) => dv.setUint16(offset, value, true),
    float: (dv, offset, value) => dv.setFloat32(offset, value, true),
}

export class VertexWriter extends BaseVertexWriter<DataViewCaller> {
    private readonly _dv: DataView;

    constructor(source: VertexWriterSource, schema: VertexSchema) {
        super(source, schema);
        const {buffer, offset, length} = wrapBuffer(source);
        this._dv = new DataView(buffer, offset, length);
        Object.assign(this._impl, dataViewCallers);
    }

    protected _write(write: DataViewCaller, position: number, i: number, meta: MetaDesc, value: number): void {
        write(this._dv, position + i * meta.bytes, value);
    }
}

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Float32Array;
type ArrayMaker = (buffer: ArrayBuffer, offset: number, length: number) => TypedArray;

const viewMakers: Record<string, ArrayMaker> = {
    byte: (buffer, offset, length) => new Int8Array(buffer, offset, length),
    ubyte: (buffer, offset, length) => new Uint8Array(buffer, offset, length),
    short: (buffer, offset, length) => new Int16Array(buffer, offset, length / 2),
    ushort: (buffer, offset, length) => new Uint16Array(buffer, offset, length / 2),
    float: (buffer, offset, length) => new Float32Array(buffer, offset, length / 4),
};

export class FluentVertexWriter extends BaseVertexWriter<TypedArray> {
    constructor(source: ArrayBufferSite, schema: VertexSchema) {
        super(source, schema);
        if (this._schema.isPacked) {
            throw raiseError(this._logger, 'not for packed schema');
        }
        const {buffer,offset,length}=wrapBuffer(source);
        this._schema.items.forEach((meta) => {
            const type = meta.type;
            if (!this._impl[type]) {
                this._impl[type] = viewMakers[type](buffer, offset, length);
            }
        });
    }

    protected _write(view: TypedArray, position: number, i: number, meta: MetaDesc, value: number): void {
        view[position / meta.bytes + i] = value;
    }
}

type VertexDesc = Record<string, number[]>;
type VertexTransformer = (vertex: VertexDesc, index: number) => VertexDesc;

export function writeVertices(writer: BaseVertexWriter, vertices: VertexDesc[], func: VertexTransformer): void {
    const names = writer.schema().items.map((item) => item.name);
    vertices.forEach((vertex, i) => {
        const data = func(vertex, i);
        names.forEach((name) => {
            if (name in data) {
                writer.writeField(i, name, data[name]);
            }
        });
    });
}
