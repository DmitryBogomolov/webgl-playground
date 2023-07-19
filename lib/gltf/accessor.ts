import type { GlTF_ACCESSOR_TYPE } from './accessor.types';
import type { GlTFAsset, GlTFSchema } from './asset.types';
import { getBinaryData } from './binary-data';

const BYTE = 5120;
const UBYTE = 5121;
const SHORT = 5122;
const USHORT = 5123;
const UINT = 5125;
const FLOAT = 5126;

// There are also MAT2, MAT3, MAT4. Skip them for now.
const ACCESSOR_TYPE_MAPPING: Readonly<Record<string, Record<number, GlTF_ACCESSOR_TYPE>>> = {
    'SCALAR': {
        [BYTE]: 'byte',
        [UBYTE]: 'ubyte',
        [SHORT]: 'short',
        [USHORT]: 'ushort',
        [UINT]: 'uint',
        [FLOAT]: 'float',
    },
    'VEC2': {
        [BYTE]: 'byte2',
        [UBYTE]: 'ubyte2',
        [SHORT]: 'short2',
        [USHORT]: 'ushort2',
        [UINT]: 'uint2',
        [FLOAT]: 'float2',
    },
    'VEC3': {
        [BYTE]: 'byte3',
        [UBYTE]: 'ubyte3',
        [SHORT]: 'short3',
        [USHORT]: 'ushort3',
        [UINT]: 'uint3',
        [FLOAT]: 'float3',
    },
    'VEC4': {
        [BYTE]: 'byte4',
        [UBYTE]: 'ubyte4',
        [SHORT]: 'short4',
        [USHORT]: 'ushort4',
        [UINT]: 'uint4',
        [FLOAT]: 'float4',
    },
};

const ACCESSOR_TYPE_SIZES: Readonly<Record<GlTF_ACCESSOR_TYPE, number>> = {
    'byte': 1,
    'byte2': 2,
    'byte3': 3,
    'byte4': 4,
    'ubyte': 1,
    'ubyte2': 2,
    'ubyte3': 3,
    'ubyte4': 4,
    'short': 2,
    'short2': 4,
    'short3': 6,
    'short4': 8,
    'ushort': 2,
    'ushort2': 4,
    'ushort3': 6,
    'ushort4': 8,
    'uint': 4,
    'uint2': 8,
    'uint3': 12,
    'uint4': 16,
    'float': 4,
    'float2': 8,
    'float3': 12,
    'float4': 16,
};

export function getAccessorType(accessor: GlTFSchema.Accessor): GlTF_ACCESSOR_TYPE {
    return ACCESSOR_TYPE_MAPPING[accessor.type as string][accessor.componentType];
}

export function getAccessorStride(gltf: GlTFSchema.GlTf, accessor: GlTFSchema.Accessor): number {
    const bufferView = gltf.bufferViews![accessor.bufferView!];
    if (bufferView.byteStride !== undefined) {
        return bufferView.byteStride;
    }
    return ACCESSOR_TYPE_SIZES[getAccessorType(accessor)];
}

export function getAccessorBinaryData(asset: GlTFAsset, accessor: GlTFSchema.Accessor): Uint8Array {
    const byteOffset = accessor.byteOffset || 0;
    const byteLength = accessor.count * getAccessorStride(asset.gltf, accessor);
    return getBinaryData(asset, accessor.bufferView!, byteOffset, byteLength);
}
