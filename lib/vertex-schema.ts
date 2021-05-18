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

function parseType(name: string, value: string): AttributeType {
    const type = value.substr(0, value.length - 1);
    if (!(type in GL_TYPES)) {
        throw logger.error('item "{0}" type name is not valid', name);
    }
    return type as AttributeType;
}

function parseSize(name: string, value: string): number {
    const size = Number(value[value.length - 1]);
    if (!(1 <= size && size <= 4)) {
        throw logger.error('item "{0}" type size is not valid', name);
    }
    return size;
}

function getAlignBytes(value: number): number {
    const rem = value % 4;
    return rem > 0 ? 4 - rem : 0;
}

export interface AttributeOptions {
    readonly name: string;
    /** byte[1234] ubyte[1234] short[1234] ushort[1234] float[1234] */
    readonly type: string;
    readonly normalized?: boolean;
    readonly offset?: number;
    readonly stride?: number;
}

export interface VertexSchemaOptions {
    readonly attributes: ReadonlyArray<AttributeOptions>;
    readonly isPacked?: boolean;
    readonly isCustom?: boolean;
}

export interface Attribute {
    readonly name: string;
    readonly type: AttributeType;
    readonly size: number;
    readonly bytes: number;
    readonly normalized: boolean;
    readonly stride: number;
    readonly offset: number;
    readonly gltype: number;
}

export interface VertexSchema {
    readonly attributes: ReadonlyArray<Attribute>;
    readonly vertexSize: number;
    readonly isPacked: boolean;
}

const logger = new Logger('VertexSchema');

export function parseVertexSchema(options: VertexSchemaOptions): VertexSchema {
    let totalSize = 0;
    const attrOptions = options.attributes;
    const isPacked = Boolean(options.isPacked);
    const attrs: Attribute[] = [];
    for (const attrOption of attrOptions) {
        const type = parseType(attrOption.name, attrOption.type);
        const size = parseSize(attrOption.name, attrOption.type);
        const bytes = BYTE_SIZES[type];
        attrs.push({
            name: attrOption.name,
            type,
            size,
            bytes,
            normalized: type !== 'float' && !!attrOption.normalized,
            stride: 0,
            offset: totalSize,
            gltype: GL_TYPES[type],
        });
        const byteSize = bytes * size;
        totalSize += byteSize + (isPacked ? 0 : getAlignBytes(byteSize));
    }
    totalSize += (isPacked ? 0 : getAlignBytes(totalSize));
    for (const attr of attrs) {
        Object.assign(attr, { stride: totalSize });
    }
    return {
        attributes: attrs,
        vertexSize: totalSize,
        isPacked,
    };
}
