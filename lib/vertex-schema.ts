import { Logger, raiseError, generateId } from './utils';
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

export interface ParseSchemaOptions {
    readonly packed?: boolean;
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

// TODO: Replace it with function.
export class VertexSchema {
    private readonly _logger: Logger;
    readonly isPacked: boolean;
    readonly attributes: ReadonlyArray<Attribute>;
    readonly vertexSize: number;

    constructor(attributes: ReadonlyArray<AttributeOptions>, options: ParseSchemaOptions = {}) {
        this._logger = new Logger(generateId('VertexSchema'));
        let totalSize = 0;
        this.isPacked = !!options.packed;
        const items: Attribute[] = [];
        attributes.forEach((field, i) => {
            if (!field.name) {
                throw raiseError(this._logger, `item ${i} "name" is not defined`);
            }
            const type = parseType(field.type);
            const size = parseSize(field.type);
            const bytes = BYTE_SIZES[type];
            if (!(bytes > 0)) {
                throw raiseError(this._logger, `item "${field.name}" type name is not valid`);
            }
            if (!(1 <= size && size <= 4)) {
                throw raiseError(this._logger, `item "${field.name}" type size is not valid`);
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
            totalSize += byteSize + (this.isPacked ? 0 : getAlignBytes(byteSize));
        });
        this.attributes = items;
        this.vertexSize = totalSize + (this.isPacked ? 0 : getAlignBytes(totalSize));
    }
}
