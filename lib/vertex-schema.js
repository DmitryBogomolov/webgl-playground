import { Logger } from './utils';
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

const logger = new Logger('Schema');

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

/**
 * @typedef {Object} SchemaDesc
 * @property {MetaDesc[]} items
 * @property {{ [name: string]: MetaDesc }} byName
 * @property {number} vertexSize
 * @property {boolean} isPacked
 */

/** @returns {SchemaDesc} */
export function parseSchema(/** @type {FieldDesc[]} */fields, /** @type {ParseSchemaOptions} */options = {}) {
    logger.log('parse_schema');
    let totalSize = 0;
    const isPacked = !!options.packed;
    /** @type {MetaDesc[]} */
    const items = [];
    /** @type {Object.<string, MetaDesc>} */
    const byName = {};
    fields.forEach((field, i) => {
        if (!field.name) {
            const message = `item ${i} "name" is not defined`;
            logger.error(message);
            throw new Error(message);
        }
        /** @type {MetaDesc} */
        const meta = { name: field.name };
        parseType(field.type, meta);
        meta.bytes = BYTE_SIZES[meta.type];
        if (!(meta.bytes > 0)) {
            const message = `item "${meta.name}" type name is not valid`;
            logger.error(message);
            throw new Error(message);
        }
        if (!(1 <= meta.size && meta.size <= 4)) {
            const message = `item "${meta.name}" type size is not valid`;
            logger.error(message);
            throw new Error(message);
        }
        meta.normalized = meta.type !== 'float' && !!field.normalized;
        meta.offset = totalSize;
        meta.gltype = GL_TYPES[meta.type];
        const byteSize = meta.bytes * meta.size;
        totalSize += byteSize + (isPacked ? 0 : getAlignBytes(byteSize));
        
        items.push(meta);
        byName[meta.name] = meta;
    });
    const vertexSize = totalSize + (isPacked ? 0 : getAlignBytes(totalSize));
    logger.log(`parsed(fields: ${items.length}, vertex_size: ${vertexSize}${isPacked ? ', packed' : ''})`);
    return {
        items,
        byName,
        vertexSize,
        isPacked,
    };
}
