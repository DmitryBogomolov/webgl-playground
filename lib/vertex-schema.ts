import { Logger } from './utils';
import { contextConstants } from './context-constants';

const {
    BYTE, UNSIGNED_BYTE,
    SHORT, UNSIGNED_SHORT,
    FLOAT,
} = contextConstants;

export type AttributeType = 'byte' | 'ubyte' | 'short' | 'ushort' | 'float';

export type AttributeTypeMap<T> = { readonly [key in AttributeType]: T };

const BYTE_SIZES: AttributeTypeMap<number> = {
    byte: 1,
    ubyte: 1,
    short: 2,
    ushort: 2,
    float: 4,
};

const GL_TYPES: AttributeTypeMap<number> = {
    byte: BYTE,
    ubyte: UNSIGNED_BYTE,
    short: SHORT,
    ushort: UNSIGNED_SHORT,
    float: FLOAT,
};

function parseType(value: string): AttributeType {
    return value.substr(0, value.length - 1) as AttributeType;
}

function parseSize(value: string): number {
    return Number(value[value.length - 1]);
}

function getAlignBytes(value: number): number {
    return value & 3 ? (value | 3) + 1 - value : 0;
}

export interface AttributeOptions {
    readonly name: string;
    /** byte[1234] ubyte[1234] short[1234] ushort[1234] float[1234] */
    readonly type: string;
    readonly normalized?: boolean;
}

export interface VertexSchemaOptions {
    readonly attributes: ReadonlyArray<AttributeOptions>;
    readonly isPacked?: boolean;
}

export interface Attribute {
    readonly name: string;
    readonly type: AttributeType;
    readonly size: number;
    readonly bytes: number;
    readonly normalized: boolean;
    readonly offset: number;
    readonly gltype: number;
}

export interface VertexSchema {
    readonly isPacked: boolean;
    readonly vertexSize: number;
    readonly attributes: ReadonlyArray<Attribute>;
}

const logger = new Logger('VertexSchema');

export function parseVertexSchema(options: VertexSchemaOptions): VertexSchema {
    let totalSize = 0;
    const isPacked = !!options.isPacked;
    const items: Attribute[] = [];
    options.attributes.forEach((field, i) => {
        if (!field.name) {
            throw logger.error('item {0} "name" is not defined', i);
        }
        const type = parseType(field.type);
        const size = parseSize(field.type);
        const bytes = BYTE_SIZES[type];
        if (!(bytes > 0)) {
            throw logger.error('item "{0}" type name is not valid', field.name);
        }
        if (!(1 <= size && size <= 4)) {
            throw logger.error('item "{0}" type size is not valid', field.name);
        }
        items.push({
            name: field.name,
            type,
            size,
            bytes,
            normalized: type !== 'float' && !!field.normalized,
            offset: totalSize,
            gltype: GL_TYPES[type],
        });
        const byteSize = bytes * size;
        totalSize += byteSize + (isPacked ? 0 : getAlignBytes(byteSize));
    });
    return {
        isPacked,
        vertexSize: totalSize + (isPacked ? 0 : getAlignBytes(totalSize)),
        attributes: items,
    };
}
