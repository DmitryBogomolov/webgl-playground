import { Logger, raiseError, generateId } from './utils';
import { contextConstants } from './context-constants';

const {
    BYTE, UNSIGNED_BYTE,
    SHORT, UNSIGNED_SHORT,
    FLOAT,
} = contextConstants;

// byte[1234] ubyte[1234] short[1234] ushort[1234] float[1234]
type FieldType = 'byte' | 'ubyte' | 'short' | 'ushort' | 'float';
type ByteSizeMap = {
    readonly [key in FieldType]: number;
}
type GlTypeMap = {
    readonly [key in FieldType]: number;
}

const BYTE_SIZES: ByteSizeMap = {
    byte: 1,
    ubyte: 1,
    short: 2,
    ushort: 2,
    float: 4,
};

const GL_TYPES: GlTypeMap = {
    byte: BYTE,
    ubyte: UNSIGNED_BYTE,
    short: SHORT,
    ushort: UNSIGNED_SHORT,
    float: FLOAT,
};

function parseType(value: string): FieldType {
    return value.substr(0, value.length - 1) as FieldType;
}

function parseSize(value: string): number {
    return Number(value[value.length - 1]);
}

function getAlignBytes(value: number): number {
    return value & 3 ? (value | 3) + 1 - value : 0;
}

export interface FieldDesc {
    readonly name: string;
    readonly type: string;
    readonly normalized?: boolean;
}

export interface ParseSchemaOptions {
    readonly packed?: boolean;
}

export interface MetaDesc {
    readonly name: string;
    readonly type: FieldType;
    readonly size: number;
    readonly bytes: number;
    readonly normalized: boolean;
    readonly offset: number;
    readonly gltype: number;
}

export class VertexSchema {
    private readonly _logger: Logger;
    readonly isPacked: boolean;
    readonly items: ReadonlyArray<MetaDesc>;
    readonly vertexSize: number;

    constructor(fields: ReadonlyArray<FieldDesc>, options: ParseSchemaOptions = {}) {
        this._logger = new Logger(generateId('VertexSchema'));
        let totalSize = 0;
        this.isPacked = !!options.packed;
        const items: MetaDesc[] = [];
        fields.forEach((field, i) => {
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
        this.items = items;
        this.vertexSize = totalSize + (this.isPacked ? 0 : getAlignBytes(totalSize));
        this._logger.log(
            `parsed(fields: ${this.items.length}, vertex_size: ${this.vertexSize}${this.isPacked ? ', packed' : ''})`,
        );
    }
}
