import type {
    AttributeType, AttributeTypeMap, Attribute, AttributeOptions, VertexSchema,
} from './vertex-schema.types';
import type { Logger } from '../utils/logger.types';
import { LoggerImpl } from '../utils/logger';


const WebGL = WebGLRenderingContext.prototype;

const GL_TYPES: AttributeTypeMap<number> = {
    byte: WebGL.BYTE,
    ubyte: WebGL.UNSIGNED_BYTE,
    short: WebGL.SHORT,
    ushort: WebGL.UNSIGNED_SHORT,
    float: WebGL.FLOAT,
};

const BYTE_SIZES: AttributeTypeMap<number> = {
    byte: 1,
    ubyte: 1,
    short: 2,
    ushort: 2,
    float: 4,
};

function parseType({ name, type }: AttributeOptions, logger: Logger): AttributeType {
    const ret = type.substring(0, type.length - 1);
    if (!(ret in GL_TYPES)) {
        throw logger.error('item "{0}" type "{1}" name is not valid', name, type);
    }
    return ret as AttributeType;
}

function parseSize({ name, type }: AttributeOptions, logger: Logger): number {
    const size = Number(type[type.length - 1]);
    if (!(1 <= size && size <= 4)) {
        throw logger.error('item "{0}" type "{1}" size is not valid', name, type);
    }
    return size;
}

function getOffset({ name, offset }: AttributeOptions, currentOffset: number, logger: Logger): number {
    if (offset !== undefined) {
        if (offset % 4 !== 0) {
            throw logger.error('item "{0}" offset "{1}" is not valid', name, offset);
        }
        return offset;
    }
    return currentOffset;
}

function getStride({ name, stride }: AttributeOptions, logger: Logger): number {
    if (stride !== undefined) {
        if (stride % 4 !== 0) {
            throw logger.error('item "{0}" stride "{1}" is not valid', name, stride);
        }
        return stride;
    }
    return 0;
}

const defaultLogger = new LoggerImpl('VertexSchema');

export function parseVertexSchema(
    attrOptions: ReadonlyArray<AttributeOptions>, logger: Logger = defaultLogger,
): VertexSchema {
    const attributes: Attribute[] = [];
    let currentOffset = 0;
    for (let i = 0; i < attrOptions.length; ++i) {
        const attrOption = attrOptions[i];
        const type = parseType(attrOption, logger);
        const size = parseSize(attrOption, logger);
        const offset = getOffset(attrOption, currentOffset, logger);
        attributes.push({
            name: attrOption.name,
            location: i,
            type,
            gltype: GL_TYPES[type],
            size,
            normalized: type !== 'float' && !!attrOption.normalized,
            stride: getStride(attrOption, logger),
            offset,
        });
        currentOffset = offset + BYTE_SIZES[type] * size;
        const mod = currentOffset % 4;
        currentOffset += mod > 0 ? 4 - mod : 0;
    }
    for (const attr of attributes) {
        // @ts-ignore This is part of Attribute construction.
        attr.stride = attr.stride || currentOffset;
    }
    return {
        attributes,
        totalSize: currentOffset,
    };
}
