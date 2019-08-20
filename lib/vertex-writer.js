const writers = {
    byte: (dv, offset, value) => dv.setInt8(offset, value),
    ubyte: (dv, offset, value) => dv.setUint8(offset, value),
    short: (dv, offset, value) => dv.setInt16(offset, value, true),
    ushort: (dv, offset, value) => dv.setUint16(offset, value, true),
    float: (dv, offset, value) => dv.setFloat32(offset, value, true),
};

const normalizers = {
    byte: (value) => Math.round(value * 0x7F),
    ubyte: (value) => Math.round(value * 0xFF),
    short: (value) => Math.round(value * 0x7FFF),
    ushort: (value) => Math.round(value * 0xFFFF),
};

function eigen(value) {
    return value;
}

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
