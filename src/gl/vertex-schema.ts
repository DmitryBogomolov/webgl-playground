import type {
    VERTEX_ATTRIBUTE_TYPE, VertexSchemaDefinition, VertexAttributeInfo, VertexSchemaInfo,
} from './vertex-schema.types';
import type { Mapping } from '../common/mapping.types';

const WebGL = WebGLRenderingContext.prototype;

interface TypeInfo {
    readonly type: number;
    readonly rank: number;
    readonly size: number;
}

const ATTRIBUTE_TYPE_MAP: Mapping<VERTEX_ATTRIBUTE_TYPE, TypeInfo> = {
    'byte': { type: WebGL.BYTE, rank: 1, size: 1 },
    'byte2': { type: WebGL.BYTE, rank: 2, size: 1 },
    'byte3': { type: WebGL.BYTE, rank: 3, size: 1 },
    'byte4': { type: WebGL.BYTE, rank: 4, size: 1 },
    'ubyte': { type: WebGL.UNSIGNED_BYTE, rank: 1, size: 1 },
    'ubyte2': { type: WebGL.UNSIGNED_BYTE, rank: 2, size: 1 },
    'ubyte3': { type: WebGL.UNSIGNED_BYTE, rank: 3, size: 1 },
    'ubyte4': { type: WebGL.UNSIGNED_BYTE, rank: 4, size: 1 },
    'short': { type: WebGL.SHORT, rank: 1, size: 2 },
    'short2': { type: WebGL.SHORT, rank: 2, size: 2 },
    'short3': { type: WebGL.SHORT, rank: 3, size: 2 },
    'short4': { type: WebGL.SHORT, rank: 4, size: 2 },
    'ushort': { type: WebGL.UNSIGNED_SHORT, rank: 1, size: 2 },
    'ushort2': { type: WebGL.UNSIGNED_SHORT, rank: 2, size: 2 },
    'ushort3': { type: WebGL.UNSIGNED_SHORT, rank: 3, size: 2 },
    'ushort4': { type: WebGL.UNSIGNED_SHORT, rank: 4, size: 2 },
    'int': { type: WebGL.INT, rank: 1, size: 4 },
    'int2': { type: WebGL.INT, rank: 2, size: 4 },
    'int3': { type: WebGL.INT, rank: 3, size: 4 },
    'int4': { type: WebGL.INT, rank: 4, size: 4 },
    'uint': { type: WebGL.UNSIGNED_INT, rank: 1, size: 4 },
    'uint2': { type: WebGL.UNSIGNED_INT, rank: 2, size: 4 },
    'uint3': { type: WebGL.UNSIGNED_INT, rank: 3, size: 4 },
    'uint4': { type: WebGL.UNSIGNED_INT, rank: 4, size: 4 },
    'float': { type: WebGL.FLOAT, rank: 1, size: 4 },
    'float2': { type: WebGL.FLOAT, rank: 2, size: 4 },
    'float3': { type: WebGL.FLOAT, rank: 3, size: 4 },
    'float4': { type: WebGL.FLOAT, rank: 4, size: 4 },
};

export function parseVertexSchema(schema: VertexSchemaDefinition): VertexSchemaInfo {
    if (!schema) {
        throw new Error('schema not defined');
    }
    if (schema.attributes.length === 0) {
        throw new Error('schema has no attributes');
    }
    const list: VertexAttributeInfo[] = [];
    let currentOffset = 0;
    let totalSize = 0;
    const locations = new Set<number>();
    for (let i = 0; i < schema.attributes.length; ++i) {
        const attribute = schema.attributes[i];

        let { location, offset, stride } = attribute;
        if (location !== undefined) {
            if (location < 0) {
                throw new Error(`attribute ${i} - bad location: ${location}`);
            }
        } else {
            location = i;
        }

        if (locations.has(location)) {
            throw new Error(`attribute ${i} - duplicate location: ${location}`);
        }
        locations.add(location);

        const typeInfo = ATTRIBUTE_TYPE_MAP[attribute.type];
        if (!typeInfo) {
            throw new Error(`attribute ${i} - bad type: ${attribute.type}`);
        }
        const byteSize = getAttrByteSize(typeInfo);

        if (offset !== undefined) {
            if (offset < 0 || offset % typeInfo.size !== 0) {
                throw new Error(`attribute ${i} - bad offset ${offset}`);
            }
        } else {
            offset = -1;
        }

        if (stride !== undefined) {
            if (stride % typeInfo.size !== 0 || stride < byteSize) {
                throw new Error(`attribute ${i} - bad stride ${stride}`);
            }
            if (offset === -1) {
                throw new Error(`attribute ${i} - no offset`);
            }
        } else {
            stride = -1;
            if (offset === -1) {
                offset = currentOffset;
                currentOffset += byteSize;
            }
        }

        const normalized = isNormalizable(typeInfo) && Boolean(attribute.normalized);

        list.push({
            location,
            ...typeInfo,
            offset,
            stride,
            normalized,
        });
        totalSize += byteSize;
    }
    for (let i = 0; i < list.length; ++i) {
        const item = list[i];
        if (item.stride === -1) {
            // @ts-ignore Part of object initialization.
            item.stride = currentOffset;
        }
    }
    return { attributes: list, vertexSize: totalSize };
}

function align(bytes: number): number {
    const residue = bytes % 4;
    return residue === 0 ? bytes : bytes + (4 - residue);
}

function getAttrByteSize(typeInfo: TypeInfo): number {
    return align(typeInfo.rank * typeInfo.size);
}

function isNormalizable(typeInfo: TypeInfo): boolean {
    return typeInfo.type !== WebGL.FLOAT;
}
