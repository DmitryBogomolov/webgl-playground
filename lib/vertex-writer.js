import { error } from './utils';

const normalizers = {
    byte: (value) => Math.round(value * 0x7F),
    ubyte: (value) => Math.round(value * 0xFF),
    short: (value) => Math.round(value * 0x7FFF),
    ushort: (value) => Math.round(value * 0xFFFF),
};

function eigen(value) {
    return value;
}

class BaseVertexWriter {
    constructor(buffer, schema) {
        this._schema = schema;
        this._init(buffer);
    }

    _getPosition(vertexIndex, meta) {
        return this._schema.vertexSize * vertexIndex + meta.offset;
    }

    writeField(vertexIndex, fieldName, value) {
        const meta = this._schema.byName[fieldName];
        const position = this._getPosition(vertexIndex, meta);
        const normalize = meta.normalized ? normalizers[meta.type] : eigen;
        const impl = this._impl[meta.type];
        for (let i = 0; i < meta.size; ++i) {
            this._write(impl, position, i, meta, normalize(value[i]));
        }
    }
}

export class VertexWriter extends BaseVertexWriter {
    _init(buffer) {
        this._dv = new DataView(buffer);
    }
    
    _write(write, position, i, meta, value) {
        write(this._dv, position + i * meta.bytes, value);
    }
}

VertexWriter.prototype._impl = {
    byte: (dv, offset, value) => dv.setInt8(offset, value),
    ubyte: (dv, offset, value) => dv.setUint8(offset, value),
    short: (dv, offset, value) => dv.setInt16(offset, value, true),
    ushort: (dv, offset, value) => dv.setUint16(offset, value, true),
    float: (dv, offset, value) => dv.setFloat32(offset, value, true),
};

const VIEWS = {
    byte: Int8Array,
    ubyte: Uint8Array,
    short: Int16Array,
    ushort: Uint16Array,
    float: Float32Array,
};

export class FluentVertexWriter extends BaseVertexWriter {
    _init(buffer) {
        if (this._schema.isPacked) {
            error('FluentVertexWriter', new Error('not for packed schema'));
        }
        this._impl = {};
        this._schema.items.forEach((meta) => {
            const type = meta.type;
            if (!this._impl[type]) {
                this._impl[type] = new VIEWS[type](buffer);
            }
        });
    }

    _getPosition(vertexIndex, meta) {
        return super._getPosition(vertexIndex, meta) / meta.bytes;
    }

    _write(view, position, i, meta, value) {
        view[position + i] = value;
    }
}
