import { log, error } from './utils';
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

const LOG_SECTION = 'Schema';

function parseType(value, target) {
    const last = value.length - 1;
    target.type = value.substr(0, last);
    target.size = Number(value[last]);
}

function getAlignBytes(value) {
    return value & 3 ? (value | 3) + 1 - value : 0;
}

export function parseSchema(fields, options = {}) {
    log(LOG_SECTION, 'parse_schema');
    let totalSize = 0;
    const isPacked = !!options.packed;
    const items = [];
    const byName = {};
    fields.forEach((item, i) => {
        if (!item.name) {
            error(LOG_SECTION, new Error(`item ${i} "name" is not defined`));
        }
        const meta = { name: item.name };
        parseType(item.type, meta);
        meta.bytes = BYTE_SIZES[meta.type];
        if (!(meta.bytes > 0)) {
            error(LOG_SECTION, new Error(`item "${meta.name}" type name is not valid`));
        }
        if (!(1 <= meta.size && meta.size <= 4)) {
            error(LOG_SECTION, new Error(`item "${meta.name}" type size is not valid`));
        }
        meta.normalized = meta.type !== 'float' && !!item.normalized;
        meta.offset = totalSize;
        meta.gltype = GL_TYPES[meta.type];
        const byteSize = meta.bytes * meta.size;
        totalSize += byteSize + (isPacked ? 0 : getAlignBytes(byteSize));
        
        items.push(meta);
        byName[meta.name] = meta;
    });
    const vertexSize = totalSize + (isPacked ? 0 : getAlignBytes(totalSize));
    log(LOG_SECTION, `parsed(fields: ${items.length}, vertex_size: ${vertexSize}${isPacked ? ', packed' : ''})`);
    return {
        items,
        byName,
        vertexSize,
        isPacked,
    };
}
