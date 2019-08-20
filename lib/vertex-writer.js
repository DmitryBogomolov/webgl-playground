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

const writers = {
    byte: (dv, offset, value) => dv.setInt8(offset, value),
    ubyte: (dv, offset, value) => dv.setUint8(offset, value),
    short: (dv, offset, value) => dv.setInt16(offset, value, true),
    ushort: (dv, offset, value) => dv.setUint16(offset, value, true),
    float: (dv, offset, value) => dv.setFloat32(offset, value, true),
};

export class VertexWriter {
    constructor(buffer, schema) {
        this._dv = new DataView(buffer);
        this._schema = schema;
    }

    writeField(vertexIndex, fieldName, value) {
        const meta = this._schema.byName[fieldName];
        const position = this._schema.vertexSize * vertexIndex + meta.offset;
        const normalize = meta.normalized ? normalizers[meta.type] : eigen;
        const write = writers[meta.type];
        for (let i = 0; i < meta.size; ++i) {
            write(this._dv, position + i * meta.bytes, normalize(value[i]));
        }
    }
}

const views = {
    byte: Int8Array,
    ubyte: Uint8Array,
    short: Int16Array,
    ushort: Uint16Array,
    float: Float32Array,
};

export class FluentVertexWriter {
    constructor(buffer, schema) {
        if (schema.isPacked) {
            error('FluentVertexWriter', new Error('not for packed schema'));
        }
        this._views = {};
        this._schema = schema;
        schema.items.forEach((item) => {
            if (!this._views[item.type]) {
                this._views[item.type] = new views[item.type](buffer);
            }
        });
    }

    writeField(vertexIndex, fieldName, value) {
        const meta = this._schema.byName[fieldName];
        const position = this._schema.vertexSize * vertexIndex + meta.offset;
        const index = position / views[meta.type].BYTES_PER_ELEMENT;
        const view = this._views[meta.type];
        const normalize = meta.normalized ? normalizers[meta.type] : eigen;
        for (let i = 0; i < meta.size; ++i) {
            view[index + i] = normalize(value[i]);
        }
    }
}
