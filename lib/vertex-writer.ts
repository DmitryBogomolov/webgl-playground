import { Logger } from './utils';
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

export type AttrValue = ReadonlyArray<number>;
type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Float32Array;
type ArrayMaker = (buffer: ArrayBuffer, offset: number, length: number) => TypedArray;

const viewMakers: AttributeTypeMap<ArrayMaker> = {
    byte: (buffer, offset, length) => new Int8Array(buffer, offset, length),
    ubyte: (buffer, offset, length) => new Uint8Array(buffer, offset, length),
    short: (buffer, offset, length) => new Int16Array(buffer, offset, length / 2),
    ushort: (buffer, offset, length) => new Uint16Array(buffer, offset, length / 2),
    float: (buffer, offset, length) => new Float32Array(buffer, offset, length / 4),
};

function buildMap(schema: VertexSchema): AttributesMap {
    const result: Record<string, Attribute> = {};
    schema.attributes.forEach((meta) => {
        result[meta.name] = meta;
    });
    return result;
}

function buildViews(schema: VertexSchema, target: ArrayBufferView): AttributeTypeMap<TypedArray> {
    // @ts-ignore Delayed construction.
    const obj: Record<AttributeType, TypedArray> = {};
    for (const attr of schema.attributes) {
        obj[attr.type] = obj[attr.type] || viewMakers[attr.type](target.buffer, target.byteOffset, target.byteLength);
    }
    return obj;
}

function wrapBuffer(buffer: ArrayBufferView | ArrayBuffer): ArrayBufferView {
    return ArrayBuffer.isView(buffer) ? buffer : { buffer, byteOffset: 0, byteLength: buffer.byteLength };
}

const logger = new Logger('VertexWriter');

export class VertexWriter {
    private readonly _attrs: AttributesMap;
    private readonly _views: AttributeTypeMap<TypedArray>;

    constructor(schema: VertexSchema, target: ArrayBufferView | ArrayBuffer) {
        this._attrs = buildMap(schema);
        this._views = buildViews(schema, wrapBuffer(target));
    }

    writeAttribute(vertexIndex: number, attrName: string, attrValue: AttrValue): void {
        const attr = this._attrs[attrName];
        if (!attr) {
            throw logger.error('attribute "{0}" is unknown', attrName);
        }
        if (attr.size !== attrValue.length) {
            throw logger.error(
                'attribute "{0}" size is {1} but value is {2}', attrName, attr.size, attrValue,
            );
        }
        const view = this._views[attr.type];
        const base = (attr.offset + attr.stride * vertexIndex) / view.BYTES_PER_ELEMENT | 0;
        const normalize = attr.normalized ? normalizers[attr.type] : eigen;
        for (let i = 0; i < attr.size; ++i) {
            view[base + i] = normalize(attrValue[i]);
        }
    }
}
