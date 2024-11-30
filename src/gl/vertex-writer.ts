import type { VertexAttributeInfo, VertexSchemaInfo } from './vertex-schema.types';
import type { ATTRIBUTE_VALUE } from './vertex-writer.types';
import type { Mapping } from '../common/mapping.types';
import { isVec2 } from '../geometry/vec2';
import { isVec3 } from '../geometry/vec3';
import { isVec4 } from '../geometry/vec4';
import { isColor } from '../common/color';
import { toStr } from '../utils/string-formatter';

const WebGL = WebGLRenderingContext.prototype;

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array;
type ArrayMaker = (buffer: ArrayBuffer, offset: number, length: number) => TypedArray;
const VIEW_MAKERS_MAP: Mapping<number, ArrayMaker> = {
    [WebGL.BYTE]: (buffer, offset, length) => new Int8Array(buffer, offset, length),
    [WebGL.UNSIGNED_BYTE]: (buffer, offset, length) => new Uint8Array(buffer, offset, length),
    [WebGL.SHORT]: (buffer, offset, length) => new Int16Array(buffer, offset, length / 2),
    [WebGL.UNSIGNED_SHORT]: (buffer, offset, length) => new Uint16Array(buffer, offset, length / 2),
    [WebGL.INT]: (buffer, offset, length) => new Int32Array(buffer, offset, length / 4),
    [WebGL.UNSIGNED_INT]: (buffer, offset, length) => new Uint32Array(buffer, offset, length / 4),
    [WebGL.FLOAT]: (buffer, offset, length) => new Float32Array(buffer, offset, length / 4),
};

type Normalizer = (value: number) => number;
const NORMALIZERS_MAP: Mapping<number, Normalizer> = {
    [WebGL.BYTE]: (value) => Math.round(value * 0x7F),
    [WebGL.UNSIGNED_BYTE]: (value) => Math.round(value * 0xFF),
    [WebGL.SHORT]: (value) => Math.round(value * 0x7FFF),
    [WebGL.UNSIGNED_SHORT]: (value) => Math.round(value * 0xFFFF),
    [WebGL.INT]: (value) => Math.round(value * 0x7FFFFFFF),
    [WebGL.UNSIGNED_INT]: (value) => Math.round(value * 0xFFFFFFFF),
    [WebGL.FLOAT]: () => { throw new Error('not supported'); },
};

type Unwrapper = (value: ATTRIBUTE_VALUE) => number[] | null;
const UNWRAPPERS_MAP: Mapping<number, Unwrapper> = {
    [1]: unwrap1,
    [2]: unwrap2,
    [3]: unwrap3,
    [4]: unwrap4,
};

export function writeVertexData<T>(
    vertices: Iterable<T> & { readonly length: number },
    vertexSchema: VertexSchemaInfo,
    getVertexValues: (vertex: T) => ATTRIBUTE_VALUE[],
    out?: Uint8Array,
): Uint8Array {
    const byteLength = vertices.length * vertexSchema.vertexSize;
    const vertexData = out ? new Uint8Array(out.buffer, out.byteOffset, byteLength) : new Uint8Array(byteLength);
    const writer = new VertexWriter(vertexSchema, vertexData);
    const attrCount = vertexSchema.attributes.length;
    let vertexIdx = 0;
    for (const vertex of vertices) {
        const values = getVertexValues(vertex);
        for (let attrIdx = 0; attrIdx < attrCount; ++attrIdx) {
            writer.writeAttribute(vertexIdx, attrIdx, values[attrIdx]);
        }
        ++vertexIdx;
    }
    return vertexData;
}

export class VertexWriter {
    private readonly _target: ArrayBufferView;
    private readonly _attributes: ReadonlyArray<VertexAttributeInfo>;
    private readonly _views = new Map<number, TypedArray>();

    constructor(schema: VertexSchemaInfo, target: ArrayBufferLike) {
        this._target = wrapBuffer(target);
        this._attributes = schema.attributes;
    }

    private _getView(type: number): TypedArray {
        let view = this._views.get(type);
        if (!view) {
            view = VIEW_MAKERS_MAP[type](this._target.buffer, this._target.byteOffset, this._target.byteLength);
            this._views.set(type, view);
        }
        return view;
    }

    writeAttribute(vertexIdx: number, attrIdx: number, attrValue: ATTRIBUTE_VALUE): void {
        const attribute = this._attributes[attrIdx];
        if (!attribute) {
            throw new Error(`attribute ${attrIdx} not found`);
        }
        const values = UNWRAPPERS_MAP[attribute.rank](attrValue);
        if (values === null) {
            throw new Error(`attribute "${attrIdx}" rank is ${attribute.rank} but value is ${toStr(attrValue)}`);
        }
        const view = this._getView(attribute.type);
        const base = (attribute.offset + attribute.stride * vertexIdx) / view.BYTES_PER_ELEMENT | 0;
        const normalize = attribute.normalized ? NORMALIZERS_MAP[attribute.type] : eigen;
        for (let i = 0; i < attribute.rank; ++i) {
            view[base + i] = normalize(values[i]);
        }
    }
}

function wrapBuffer(buffer: ArrayBufferView | ArrayBuffer): ArrayBufferView {
    return ArrayBuffer.isView(buffer) ? buffer : { buffer, byteOffset: 0, byteLength: buffer.byteLength };
}

function eigen<T>(value: T): T {
    return value;
}

function isNumArray(arg: unknown, length: number): arg is number[] {
    return Array.isArray(arg) && arg.length >= length;
}

const _arr_scratch: number[] = [0, 0, 0, 0];

function unwrap1(value: ATTRIBUTE_VALUE): number[] | null {
    if (typeof value === 'number') {
        _arr_scratch[0] = value;
        return _arr_scratch;
    }
    if (isNumArray(value, 1)) {
        return value;
    }
    return null;
}

function unwrap2(value: ATTRIBUTE_VALUE): number[] | null {
    if (isVec2(value)) {
        _arr_scratch[0] = value.x;
        _arr_scratch[1] = value.y;
        return _arr_scratch;
    }
    if (isNumArray(value, 2)) {
        return value;
    }
    return null;
}

function unwrap3(value: ATTRIBUTE_VALUE): number[] | null {
    if (isVec3(value)) {
        _arr_scratch[0] = value.x;
        _arr_scratch[1] = value.y;
        _arr_scratch[2] = value.z;
        return _arr_scratch;
    }
    if (isColor(value)) {
        _arr_scratch[0] = value.r;
        _arr_scratch[1] = value.g;
        _arr_scratch[2] = value.b;
        return _arr_scratch;
    }
    if (isNumArray(value, 3)) {
        return value;
    }
    return null;
}

function unwrap4(value: ATTRIBUTE_VALUE): number[] | null {
    if (isVec4(value)) {
        _arr_scratch[0] = value.x;
        _arr_scratch[1] = value.y;
        _arr_scratch[2] = value.z;
        _arr_scratch[3] = value.w;
        return _arr_scratch;
    }
    if (isColor(value)) {
        _arr_scratch[0] = value.r;
        _arr_scratch[1] = value.g;
        _arr_scratch[2] = value.b;
        _arr_scratch[3] = value.a;
        return _arr_scratch;
    }
    if (isNumArray(value, 4)) {
        return value;
    }
    return null;
}
