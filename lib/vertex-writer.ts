import { Logger, raiseError, generateId } from './utils';
import { Attribute, AttributeType, VertexSchema, AttributeTypeMap } from './vertex-schema';

type Normalizer = (value: number) => number;

const normalizers: AttributeTypeMap<Normalizer> = {
    byte: (value) => Math.round(value * 0x7F),
    ubyte: (value) => Math.round(value * 0xFF),
    short: (value) => Math.round(value * 0x7FFF),
    ushort: (value) => Math.round(value * 0xFFFF),
    float: () => { throw new Error('not supported'); },
};

function eigen<T>(value: T): T {
    return value;
}

interface AttributesMap {
    readonly [key: string]: Attribute;
}

function buildMap(schema: VertexSchema): AttributesMap {
    const result: Record<string, Attribute> = {};
    schema.attributes.forEach((meta) => {
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
    private readonly _id = generateId('VertexWriter');
    protected readonly _logger = new Logger(this._id);
    protected readonly _schema: VertexSchema;
    protected readonly _attributes: AttributesMap;
    protected readonly _impl = {} as unknown as AttributeTypeMap<T>;

    // TODO: Remove first argument.
    constructor(_source: VertexWriterSource, schema: VertexSchema) {
        this._schema = schema;
        this._attributes = buildMap(schema);
    }

    private _getPosition(vertexIndex: number, attr: Attribute): number {
        return this._schema.vertexSize * vertexIndex + attr.offset;
    }

    // TODO: Remove it.
    schema(): VertexSchema {
        return this._schema;
    }

    protected abstract _writeComponent(
        impl: T, position: number, index: number, attr: Attribute, value: number
    ): void;

    writeAttribute(vertexIndex: number, attributeName: string, attributeValue: ReadonlyArray<number>): void {
        const attr = this._attributes[attributeName];
        if (!attr) {
            throw raiseError(this._logger, `attribute "${attributeName}" is unknown`);
        }
        if (attr.size !== attributeValue.length) {
            throw raiseError(this._logger,
                `attribute "${attributeName}" size is ${attr.size} but value is [${attributeValue}]`);
        }
        const position = this._getPosition(vertexIndex, attr);
        const normalize = attr.normalized ? normalizers[attr.type] : eigen;
        const impl = this._impl[attr.type];
        for (let i = 0; i < attr.size; ++i) {
            this._writeComponent(impl, position, i, attr, normalize(attributeValue[i]));
        }
    }
}

type DataViewCaller = (dv: DataView, offset: number, value: number) => void;

const dataViewCallers: AttributeTypeMap<DataViewCaller> = {
    byte: (dv, offset, value) => dv.setInt8(offset, value),
    ubyte: (dv, offset, value) => dv.setUint8(offset, value),
    short: (dv, offset, value) => dv.setInt16(offset, value, true),
    ushort: (dv, offset, value) => dv.setUint16(offset, value, true),
    float: (dv, offset, value) => dv.setFloat32(offset, value, true),
};

export class VertexWriter extends BaseVertexWriter<DataViewCaller> {
    private readonly _dv: DataView;

    constructor(source: VertexWriterSource, schema: VertexSchema) {
        super(source, schema);
        const { buffer, offset, length } = wrapBuffer(source);
        this._dv = new DataView(buffer, offset, length);
        Object.assign(this._impl, dataViewCallers);
    }

    protected _writeComponent(
        write: DataViewCaller, position: number, index: number, attr: Attribute, value: number,
    ): void {
        write(this._dv, position + index * attr.bytes, value);
    }
}

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Float32Array;
type ArrayMaker = (buffer: ArrayBuffer, offset: number, length: number) => TypedArray;

const viewMakers: AttributeTypeMap<ArrayMaker> = {
    byte: (buffer, offset, length) => new Int8Array(buffer, offset, length),
    ubyte: (buffer, offset, length) => new Uint8Array(buffer, offset, length),
    short: (buffer, offset, length) => new Int16Array(buffer, offset, length / 2),
    ushort: (buffer, offset, length) => new Uint16Array(buffer, offset, length / 2),
    float: (buffer, offset, length) => new Float32Array(buffer, offset, length / 4),
};

export class FluentVertexWriter extends BaseVertexWriter<TypedArray> {
    constructor(source: VertexWriterSource, schema: VertexSchema) {
        super(source, schema);
        if (this._schema.isPacked) {
            throw raiseError(this._logger, 'not for packed schema');
        }
        const { buffer, offset, length } = wrapBuffer(source);
        const impl: Partial<Record<AttributeType, TypedArray>> = {};
        this._schema.attributes.forEach((meta) => {
            const type = meta.type;
            if (!impl[type]) {
                impl[type] = viewMakers[type](buffer, offset, length);
            }
        });
        Object.assign(this._impl, impl);
    }

    protected _writeComponent(
        view: TypedArray, position: number, index: number, attr: Attribute, value: number,
    ): void {
        view[position / attr.bytes + index] = value;
    }
}

interface VertexDesc {
    readonly [name: string]: ReadonlyArray<number>;
}
type VertexTransformer<T> = (vertex: T, index: number) => VertexDesc;

// TODO: Remove it.
export function writeVertices<T>(
    writer: BaseVertexWriter<unknown>, vertices: ReadonlyArray<T>, func: VertexTransformer<T>,
): void {
    const names = writer.schema().attributes.map((item) => item.name);
    vertices.forEach((vertex, i) => {
        const data = func(vertex, i);
        names.forEach((name) => {
            if (name in data) {
                writer.writeAttribute(i, name, data[name]);
            }
        });
    });
}
