import { Logger, raiseError, generateId } from './utils';
import { constants } from './constants';

const {
    BYTE, UNSIGNED_BYTE,
    SHORT, UNSIGNED_SHORT,
    FLOAT,
} = constants;

// byte[1234] ubyte[1234] short[1234] ushort[1234] float[1234]
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

function parseType(/** @type {string} */value, /** @type {MetaDesc} */target) {
    const last = value.length - 1;
    target.type = value.substr(0, last);
    target.size = Number(value[last]);
}

function getAlignBytes(/** @type {number} */value) {
    return value & 3 ? (value | 3) + 1 - value : 0;
}

/**
 * @typedef {Object} FieldDesc
 * @property {string} name
 * @property {string} type
 * @property {boolean} normalized
 */

/**
 * @typedef {Object} ParseSchemaOptions
 * @property {boolean} packed
 */

/**
 * @typedef {Object} MetaDesc
 * @property {string} name
 * @property {string} type
 * @property {number} size
 * @property {number} bytes
 * @property {boolean} normalized
 * @property {number} offset
 * @property {number} gltype
 */

export class VertexSchema {
    constructor(/** @type {FieldDesc[]} */fields, /** @type {ParseSchemaOptions} */options = {}) {
        this._logger = new Logger(generateId('VertexSchema'));
        let totalSize = 0;
        this.isPacked = !!options.packed;
        /** @type {MetaDesc[]} */
        this.items = [];
        fields.forEach((field, i) => {
            if (!field.name) {
                raiseError(this._logger, `item ${i} "name" is not defined`);
            }
            /** @type {MetaDesc} */
            const meta = { name: field.name };
            parseType(field.type, meta);
            meta.bytes = BYTE_SIZES[meta.type];
            if (!(meta.bytes > 0)) {
                raiseError(this._logger, `item "${meta.name}" type name is not valid`);
            }
            if (!(1 <= meta.size && meta.size <= 4)) {
                raiseError(this._logger, `item "${meta.name}" type size is not valid`);
            }
            meta.normalized = meta.type !== 'float' && !!field.normalized;
            meta.offset = totalSize;
            meta.gltype = GL_TYPES[meta.type];
            const byteSize = meta.bytes * meta.size;
            totalSize += byteSize + (this.isPacked ? 0 : getAlignBytes(byteSize));
            
            this.items.push(meta);
        });
        this.vertexSize = totalSize + (this.isPacked ? 0 : getAlignBytes(totalSize));
        this._logger.log(`parsed(fields: ${this.items.length}, vertex_size: ${this.vertexSize}${this.isPacked ? ', packed' : ''})`);
    }
}
