import { Logger, raiseError } from './utils';

const normalizers = {
    byte: (value) => Math.round(value * 0x7F),
    ubyte: (value) => Math.round(value * 0xFF),
    short: (value) => Math.round(value * 0x7FFF),
    ushort: (value) => Math.round(value * 0xFFFF),
};

function eigen(value) {
    return value;
}

const logger = new Logger('VertexWriter');

/** @typedef {import('./vertex-schema').SchemaDesc} SchemaDesc */
/** @typedef {import('./vertex-schema').MetaDesc} MetaDesc  */

class BaseVertexWriter {
    constructor(/** @type {ArrayBuffer} */buffer, /** @type {SchemaDesc} */schema) {
        this._schema = schema;
        this._init(buffer);
    }

    _getPosition(/** @type {number} */vertexIndex, /** @type {MetaDesc} */meta) {
        return this._schema.vertexSize * vertexIndex + meta.offset;
    }

    writeField(/** @type {number} */vertexIndex, /** @type {string} */fieldName, /** @type {number} */value) {
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
    _init(/** @type {ArrayBuffer} */buffer) {
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
    _init(/** @type {ArrayBuffer} */buffer) {
        if (this._schema.isPacked) {
            raiseError(logger, 'not for packed schema');
        }
        this._impl = {};
        this._schema.items.forEach((meta) => {
            const type = meta.type;
            if (!this._impl[type]) {
                this._impl[type] = new VIEWS[type](buffer);
            }
        });
    }

    _write(view, position, i, meta, value) {
        view[position / meta.bytes + i] = value;
    }
}
