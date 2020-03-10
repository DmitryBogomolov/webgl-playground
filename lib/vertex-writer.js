import { Logger, raiseError, generateId } from './utils';

const normalizers = {
    byte: (value) => Math.round(value * 0x7F),
    ubyte: (value) => Math.round(value * 0xFF),
    short: (value) => Math.round(value * 0x7FFF),
    ushort: (value) => Math.round(value * 0xFFFF),
};

function eigen(value) {
    return value;
}

/** @typedef {import('./vertex-schema').VertexSchema} VertexSchema */
/** @typedef {import('./vertex-schema').MetaDesc} MetaDesc  */

function buildMap(/** @type {VertexSchema} */schema) {
    /** @type {{ [name: string]: MetaDesc }} */
    const result = {};
    schema.items.forEach((meta) => {
        result[meta.name] = meta;
    });
    return result;
}

/** 
 * @typedef {Object} ArrayBufferSite 
 * @property {ArrayBuffer} buffer
 * @property {?number} offset
 * @property {?number} length
 */

/** @returns {ArrayBufferSite} */
function wrapBuffer(/** @type {ArrayBuffer | ArrayBufferSite} */buffer) {
    return buffer instanceof ArrayBuffer ? { buffer, offset: 0, length: buffer.byteLength } : buffer;
}

class BaseVertexWriter {
    constructor(/** @type {ArrayBuffer | ArrayBufferSite} */buffer, /** @type {VertexSchema} */schema) {
        this._logger = new Logger(generateId('VertexWriter'));
        this._schema = schema;
        this._byName = buildMap(schema);
        this._init(wrapBuffer(buffer));
    }

    _getPosition(/** @type {number} */vertexIndex, /** @type {MetaDesc} */meta) {
        return this._schema.vertexSize * vertexIndex + meta.offset;
    }

    schema() {
        return this._schema;
    }

    writeField(/** @type {number} */vertexIndex, /** @type {string} */fieldName, /** @type {number} */value) {
        const meta = this._byName[fieldName];
        const position = this._getPosition(vertexIndex, meta);
        const normalize = meta.normalized ? normalizers[meta.type] : eigen;
        const impl = this._impl[meta.type];
        for (let i = 0; i < meta.size; ++i) {
            this._write(impl, position, i, meta, normalize(value[i]));
        }
    }
}

export class VertexWriter extends BaseVertexWriter {
    _init(/** @type {ArrayBufferSite} */{ buffer, offset, length }) {
        this._dv = new DataView(buffer, offset, length);
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

const viewMakers = {
    byte: (buffer, offset, length) => new Int8Array(buffer, offset, length),
    ubyte: (buffer, offset, length) => new Uint8Array(buffer, offset, length),
    short: (buffer, offset, length) => new Int16Array(buffer, offset, length / 2),
    ushort: (buffer, offset, length) => new Uint16Array(buffer, offset, length / 2),
    float: (buffer, offset, length) => new Float32Array(buffer, offset, length / 4),
};

export class FluentVertexWriter extends BaseVertexWriter {
    _init(/** @type {ArrayBufferSite} */{ buffer, offset, length }) {
        if (this._schema.isPacked) {
            raiseError(this._logger, 'not for packed schema');
        }
        this._impl = {};
        this._schema.items.forEach((meta) => {
            const type = meta.type;
            if (!this._impl[type]) {
                this._impl[type] = viewMakers[type](buffer, offset, length);
            }
        });
    }

    _write(view, position, i, meta, value) {
        view[position / meta.bytes + i] = value;
    }
}

export function writeVertices(/** @type {BaseVertexWriter} */writer, /** @type {any[]} */vertices, /** @type {Function} */func) {
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
