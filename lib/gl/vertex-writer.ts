import type { ATTRIBUTE_VALUE } from './vertex-writer.types';
import type { Attribute, RAW_ATTR_TYPE, VertexSchema, AttributeTypeMap } from './vertex-schema.types';
import type { Logger } from '../utils/logger.types';
import { LoggerImpl } from '../utils/logger';
import { isVec2 } from '../geometry/vec2';
import { isVec3 } from '../geometry/vec3';
import { isVec4 } from '../geometry/vec4';
import { isColor } from '../common/color';

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
    const obj: Record<RAW_ATTR_TYPE, TypedArray> = {};
    for (const attr of schema.attributes) {
        obj[attr.type] = obj[attr.type] || viewMakers[attr.type](target.buffer, target.byteOffset, target.byteLength);
    }
    return obj;
}

function wrapBuffer(buffer: ArrayBufferView | ArrayBuffer): ArrayBufferView {
    return ArrayBuffer.isView(buffer) ? buffer : { buffer, byteOffset: 0, byteLength: buffer.byteLength };
}

type Unwrapper = (value: ATTRIBUTE_VALUE) => number[] | null;
interface UnwrappersMap {
    readonly [key: number]: Unwrapper;
}

const unwrappers: UnwrappersMap = {
    [1]: unwrap1,
    [2]: unwrap2,
    [3]: unwrap3,
    [4]: unwrap4,
};

const defaultLogger = new LoggerImpl('VertexWriter');

export class VertexWriter {
    private readonly _attrs: AttributesMap;
    private readonly _views: AttributeTypeMap<TypedArray>;
    private readonly _logger: Logger;

    constructor(schema: VertexSchema, target: ArrayBufferView | ArrayBuffer, logger: Logger = defaultLogger) {
        this._attrs = buildMap(schema);
        this._views = buildViews(schema, wrapBuffer(target));
        this._logger = logger;
    }

    writeAttribute(vertexIndex: number, attrName: string, attrValue: ATTRIBUTE_VALUE): void {
        const attr = this._attrs[attrName];
        if (!attr) {
            throw this._logger.error('attribute "{0}" is unknown', attrName);
        }
        const values = unwrappers[attr.size](attrValue);
        if (values === null) {
            throw this._logger.error(
                'attribute "{0}" size is {1} but value is {2}', attrName, attr.size, attrValue,
            );
        }
        const view = this._views[attr.type];
        const base = (attr.offset + attr.stride * vertexIndex) / view.BYTES_PER_ELEMENT | 0;
        const normalize = attr.normalized ? normalizers[attr.type] : eigen;
        for (let i = 0; i < attr.size; ++i) {
            view[base + i] = normalize(values[i]);
        }
    }
}

function isNumArray(arg: unknown, length: number): arg is number[] {
    return Array.isArray(arg) && arg.length >= length;
}

function unwrap1(value: ATTRIBUTE_VALUE): number[] | null {
    if (typeof value === 'number') {
        return [value];
    }
    if (isNumArray(value, 1)) {
        return value;
    }
    return null;
}

function unwrap2(value: ATTRIBUTE_VALUE): number[] | null {
    if (isVec2(value)) {
        return [value.x, value.y];
    }
    if (isNumArray(value, 2)) {
        return value;
    }
    return null;
}

function unwrap3(value: ATTRIBUTE_VALUE): number[] | null {
    if (isVec3(value)) {
        return [value.x, value.y, value.z];
    }
    if (isColor(value)) {
        return [value.r, value.g, value.b];
    }
    if (isNumArray(value, 3)) {
        return value;
    }
    return null;
}

function unwrap4(value: ATTRIBUTE_VALUE): number[] | null {
    if (isVec4(value)) {
        return [value.x, value.y, value.z, value.w];
    }
    if (isColor(value)) {
        return [value.r, value.g, value.b, value.a];
    }
    if (isNumArray(value, 4)) {
        return value;
    }
    return null;
}
