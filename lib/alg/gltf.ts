import type { GlTFAsset, GlTF_ACCESSOR_TYPE, GlTFSchema, GlTF_PRIMITIVE_MODE } from './gltf.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import { vec3 } from '../geometry/vec3';
import { identity4x4, update4x4, apply4x4, scaling4x4, translation4x4 } from '../geometry/mat4';

const MAGIC = 0x46546C67;
const CHUNK_JSON = 0x4E4F534A;
const CHUNK_BIN = 0x004E4942;

const EMPTY_DATA = new Uint8Array(0);

export const GLB_MEDIA_TYPE = 'model/gltf-binary';

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification
export function parseGlTF(data: ArrayBufferView): GlTFAsset {
    const arr = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const totalLength = readHeader(arr);
    if (totalLength !== arr.length) {
        throw new Error(`bad length: ${totalLength} / data length ${arr.length}`);
    }

    const jsonOffset = 12;
    const jsonChunkLength = readU32(arr, jsonOffset + 0);
    const jsonChunkType = readU32(arr, jsonOffset + 4);
    if (jsonChunkType !== CHUNK_JSON) {
        return { desc: { asset: { version: '' } }, data: EMPTY_DATA };
    }
    const jsonChunk = decodeJson(data, jsonOffset + 8, jsonChunkLength);

    const binaryOffset = jsonOffset + 8 + jsonChunkLength;
    if (binaryOffset >= totalLength) {
        return { desc: jsonChunk, data: EMPTY_DATA };
    }
    const binaryChunkLength = readU32(arr, binaryOffset + 0);
    const binaryChunkType = readU32(arr, binaryOffset + 4);
    if (binaryChunkType !== CHUNK_BIN) {
        return { desc: jsonChunk, data: EMPTY_DATA };
    }
    const binaryChunk = extractBinary(data, binaryOffset + 8, binaryChunkLength);
    return { desc: jsonChunk, data: binaryChunk };
}

function readU32(arr: Uint8Array, offset: number): number {
    return (arr[offset + 0] << 0 | arr[offset + 1] << 8 | arr[offset + 2] << 16 | arr[offset + 3] << 24);
}

function readHeader(arr: Uint8Array): number {
    const magic = readU32(arr, 0);
    const version = readU32(arr, 4);
    const totalLength = readU32(arr, 8);
    if (magic !== MAGIC) {
        throw new Error('bad magic');
    }
    if (version !== 2) {
        throw new Error(`bad version: ${version}`);
    }
    return totalLength;
}

function decodeJson(data: ArrayBufferView, offset: number, length: number): GlTFSchema.GlTf {
    const decoder = new TextDecoder();
    const view = new Uint8Array(data.buffer, data.byteOffset + offset, length);
    const str = decoder.decode(view);
    return JSON.parse(str);
}

function extractBinary(data: ArrayBufferView, offset: number, length: number): ArrayBuffer {
    const arr = new Uint8Array(data.buffer, data.byteOffset + offset, length);
    return arr.slice().buffer;
}

export function getNodeTransform(node: GlTFSchema.Node): Mat4 | null {
    if (node.scale || node.rotation || node.translation) {
        const transform = identity4x4() as Mat4Mut;
        if (node.scale) {
            const scale = vec3(node.scale[0], node.scale[1], node.scale[2]);
            apply4x4(transform, scaling4x4, scale);
        }
        if (node.rotation) {
            // TODO: Support quaternions.
        }
        if (node.translation) {
            const translate = vec3(node.translation[0], node.translation[1], node.translation[2]);
            apply4x4(transform, translation4x4, translate);
        }
        return transform;
    }
    if (node.matrix) {
        return update4x4(node.matrix);
    }
    return null;
}

const BYTE = 5120;
const UBYTE = 5121;
const SHORT = 5122;
const USHORT = 5123;
const UINT = 5125;
const FLOAT = 5126;

// There are also MAT2, MAT3, MAT4. Skip them for now.
const ACCESSOR_TYPE_MAPPING: Readonly<Record<string, Record<number, GlTF_ACCESSOR_TYPE>>> = {
    'SCALAR': {
        [BYTE]: 'byte1',
        [UBYTE]: 'ubyte1',
        [SHORT]: 'short1',
        [USHORT]: 'ushort1',
        [UINT]: 'uint1',
        [FLOAT]: 'float1',
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
    'byte1': 1,
    'byte2': 2,
    'byte3': 3,
    'byte4': 4,
    'ubyte1': 1,
    'ubyte2': 2,
    'ubyte3': 3,
    'ubyte4': 4,
    'short1': 2,
    'short2': 4,
    'short3': 6,
    'short4': 8,
    'ushort1': 2,
    'ushort2': 4,
    'ushort3': 6,
    'ushort4': 8,
    'uint1': 4,
    'uint2': 8,
    'uint3': 12,
    'uint4': 16,
    'float1': 4,
    'float2': 8,
    'float3': 12,
    'float4': 16,
};

export function getAccessorType(accessor: GlTFSchema.Accessor): GlTF_ACCESSOR_TYPE {
    return ACCESSOR_TYPE_MAPPING[accessor.type][accessor.componentType];
}

export function getAccessorStride(asset: GlTFAsset, accessor: GlTFSchema.Accessor): number {
    const bufferView = asset.desc.bufferViews![accessor.bufferView!];
    if (bufferView.byteStride !== undefined) {
        return bufferView.byteStride;
    }
    return ACCESSOR_TYPE_SIZES[getAccessorType(accessor)];
}

const PRIMITIVE_MODE_MAPPING: Readonly<Record<number, GlTF_PRIMITIVE_MODE>> = {
    [0]: 'points',
    [1]: 'lines',
    [2]: 'line_loop',
    [3]: 'line_strip',
    [4]: 'triangles',
    [5]: 'triangle_strip',
    [6]: 'triangle_fan',
};
const DEFAULT_PRIMITIVE_MODE: GlTF_PRIMITIVE_MODE = 'triangles';

export function getPrimitiveMode(primitive: GlTFSchema.MeshPrimitive): GlTF_PRIMITIVE_MODE {
    return primitive.mode !== undefined ? PRIMITIVE_MODE_MAPPING[primitive.mode] : DEFAULT_PRIMITIVE_MODE;
}

export function getBufferSlice(asset: GlTFAsset, accessor: GlTFSchema.Accessor): Uint8Array {
    const bufferView = asset.desc.bufferViews![accessor.bufferView!];
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = accessor.count * getAccessorStride(asset, accessor);
    return new Uint8Array(asset.data, byteOffset, byteLength);
}

