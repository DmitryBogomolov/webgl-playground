import { constants } from './constants';

const {
    BYTE, UNSIGNED_BYTE,
    SHORT, UNSIGNED_SHORT,
    FLOAT,
} = constants;

const BYTE_SIZES = {
    byte: 1,
    ubyte: 1,
    short: 2,
    ushort: 2,
    float: 4,
};

const GL_TYPES = {
    byte: BYTE,
    ubyte: UNSIGNED_BYTE,
    short: SHORT,
    ushort: UNSIGNED_SHORT,
    float: FLOAT,
};

function parseType(value) {
    const last = value.length - 1;
    const type = value.substr(0, last);
    const size = Number(value[last]);
    return { type, size };
}

function getAlignBytes(value) {
    return value & 3 ? (value | 3) + 1 - value : 0;
}

// TODO: Looks like it should be just a function.
export class VertexSchema {
    // byte[1234] ubyte[1234] short[1234] ushort[1234] float[1234]
    constructor(fields, options = {}) {
        let totalSize = 0;
        const isPacked = options.packed;
        this._items = fields.map((item) => {
            // TODO: Validate `item.type`.
            // TODO: Validate that `item.name` is defined.
            const { type, size } = parseType(item.type);
            const meta = {
                name: item.name,
                type,
                size,
                bytes: BYTE_SIZES[type],
                normalized: type !== 'float' && !!item.normalized,
                offset: totalSize,
                gltype: GL_TYPES[type],
            };
            const byteSize = meta.bytes * size;
            totalSize += byteSize + (isPacked ? 0 : getAlignBytes(byteSize));
            return meta;
        });
        this._vertexSize = totalSize + (isPacked ? 0 : getAlignBytes(totalSize));
        this._isPacked = !!isPacked;
    }

    vertexSize() {
        return this._vertexSize;
    }

    items() {
        return this._items;
    }

    isPacked() {
        return this._isPacked;
    }
}
