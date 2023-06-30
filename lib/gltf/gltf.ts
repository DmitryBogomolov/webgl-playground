import type {
    GlTFAsset, GlTF_ACCESSOR_TYPE, GlTFSchema, GlTF_PRIMITIVE_MODE, GlTFResolveUriFunc, GlTFMaterial,
} from './gltf.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import { vec3 } from '../geometry/vec3';
import { vec4 } from '../geometry/vec4';
import { quat4toAxisAngle } from '../geometry/quat4';
import { identity4x4, update4x4, apply4x4, scaling4x4, rotation4x4, translation4x4 } from '../geometry/mat4';
import { color } from '../common/color';
import { Vec4Mut } from 'lib/geometry/vec4.types';

const MAGIC = 0x46546C67;
const CHUNK_JSON = 0x4E4F534A;
const CHUNK_BIN = 0x004E4942;

export const GLTF_MEDIA_TYPE = 'model/gltf+json';
export const GLB_MEDIA_TYPE = 'model/gltf-binary';

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification
export function parseGlTF(data: ArrayBufferView, resolveUri?: GlTFResolveUriFunc): Promise<GlTFAsset> {
    const asset = tryParseJson(data) || parseGlb(data);
    return resolveReferences(asset, resolveUri || defaultResolveUri);
}

const defaultResolveUri: GlTFResolveUriFunc = (uri) => {
    return Promise.reject(new Error(`cannot resolve ${uri}`));
};

function tryParseJson(data: ArrayBufferView): GlTFAsset | null {
    const view = new Uint8Array(data.buffer, data.byteOffset, 1);
    const first = view[0];
    // Lightweight guess that it is JSON content.
    if (first !== '\n'.charCodeAt(0) && first !== '{'.charCodeAt(0)) {
        return null;
    }
    try {
        const gltf = decodeJson(data, 0, data.byteLength);
        return { gltf, buffers: [], images: [] };
    } catch {
        return null;
    }
}

function parseGlb(data: ArrayBufferView): GlTFAsset {
    const arr = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const totalLength = readHeader(arr);
    if (totalLength !== arr.length) {
        throw new Error(`bad length: ${totalLength} / data length ${arr.length}`);
    }

    const jsonOffset = 12;
    const jsonChunkLength = readU32(arr, jsonOffset + 0);
    const jsonChunkType = readU32(arr, jsonOffset + 4);
    if (jsonChunkType !== CHUNK_JSON) {
        return { gltf: { asset: { version: '' } }, buffers: [], images: [] };
    }
    const jsonChunk = decodeJson(data, jsonOffset + 8, jsonChunkLength);

    const binaryOffset = jsonOffset + 8 + jsonChunkLength;
    if (binaryOffset >= totalLength) {
        checkNoBuffers(jsonChunk);
        return { gltf: jsonChunk, buffers: [], images: [] };
    }
    const binaryChunkLength = readU32(arr, binaryOffset + 0);
    const binaryChunkType = readU32(arr, binaryOffset + 4);
    if (binaryChunkType !== CHUNK_BIN) {
        checkNoBuffers(jsonChunk);
        return { gltf: jsonChunk, buffers: [], images: [] };
    }
    const binaryChunk = extractBinary(data, binaryOffset + 8, binaryChunkLength);
    checkSingleBuffer(jsonChunk, binaryChunk);
    return { gltf: jsonChunk, buffers: [binaryChunk], images: [] };
}

function checkNoBuffers(gltf: GlTFSchema.GlTf): void {
    if (gltf.buffers && gltf.buffers.length > 0) {
        throw new Error('buffers should not be defined');
    }
}

function checkSingleBuffer(gltf: GlTFSchema.GlTf, buffer: ArrayBuffer): void {
    const { buffers } = gltf;
    if (!(buffers && buffers.length === 1)) {
        throw new Error('buffers should have single item');
    }
    if (buffers[0].byteLength !== buffer.byteLength) {
        throw new Error('binary chunk length does not match buffer');
    }
}

function resolveReferences(asset: GlTFAsset, resolveUri: GlTFResolveUriFunc): Promise<GlTFAsset> {
    const assetBuffers = asset.buffers.slice();
    const assetImages = asset.images.slice();
    const errors: Error[] = [];
    const { buffers, images } = asset.gltf;
    const tasks: Promise<void>[] = [];
    if (buffers) {
        for (let i = 0; i < buffers.length; ++i) {
            const { uri } = buffers[i];
            if (uri) {
                tasks.push(resolveReference(uri, i, assetBuffers, errors, resolveUri));
            }
        }
    }
    if (images) {
        for (let i = 0; i < images.length; ++i) {
            const { uri } = images[i];
            if (uri) {
                tasks.push(resolveReference(uri, i, assetImages, errors, resolveUri));
            }
        }
    }
    return Promise.all(tasks).then(() => {
        if (errors.length > 0) {
            const msg = errors.map((err) => err.message).join('; ');
            return Promise.reject(new Error(msg));
        }
        return { gltf: asset.gltf, buffers: assetBuffers, images: assetImages };

    });
}

function resolveReference(
    uri: string, idx: number, buffers: ArrayBuffer[], errors: Error[], resolveUri: GlTFResolveUriFunc,
): Promise<void> {
    return resolveUri(uri).then(
        (data) => {
            const buf = new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice().buffer;
            buffers[idx] = buf;
        },
        (err: Error) => {
            errors.push(err);
        },
    );
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
    return JSON.parse(str) as GlTFSchema.GlTf;
}

function extractBinary(data: ArrayBufferView, offset: number, length: number): ArrayBuffer {
    const arr = new Uint8Array(data.buffer, data.byteOffset + offset, length);
    return arr.slice().buffer;
}

export function getNodeTransform(node: GlTFSchema.Node): Mat4 | null {
    if (node.scale || node.rotation || node.translation) {
        const transform = identity4x4() as Mat4Mut;
        if (node.scale) {
            const scale = vec3(...node.scale as [number, number, number]);
            apply4x4(transform, scaling4x4, scale);
        }
        if (node.rotation) {
            const rotation = vec4(...node.rotation as [number, number, number, number]);
            quat4toAxisAngle(rotation, rotation as Vec4Mut);
            apply4x4(transform, rotation4x4, rotation, rotation.w);
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
    return ACCESSOR_TYPE_MAPPING[accessor.type as string][accessor.componentType];
}

export function getAccessorStride(asset: GlTFAsset, accessor: GlTFSchema.Accessor): number {
    const bufferView = asset.gltf.bufferViews![accessor.bufferView!];
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
    const bufferView = asset.gltf.bufferViews![accessor.bufferView!];
    const buffer = asset.buffers[bufferView.buffer];
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = accessor.count * getAccessorStride(asset, accessor);
    return new Uint8Array(buffer, byteOffset, byteLength);
}

const DEFAULT_MATERIAL: GlTFMaterial = {
    baseColorFactor: color(1, 1, 1, 1),
    // Specification states that default material metallic factor is 1.
    // Actually such material looks too dark. For better visual effect default metallic is changed to 0.
    metallicFactor: 0,
    roughnessFactor: 1,
    baseColorTexture: null,
    metallicRoughnessTexture: null,
};

export function getPrimitiveMaterial(asset: GlTFAsset, primitive: GlTFSchema.MeshPrimitive): GlTFMaterial {
    if (primitive.material === undefined) {
        return DEFAULT_MATERIAL;
    }
    const { pbrMetallicRoughness } = asset.gltf.materials![primitive.material];
    if (!pbrMetallicRoughness) {
        return DEFAULT_MATERIAL;
    }
    const baseColorFactor = pbrMetallicRoughness.baseColorFactor !== undefined
        ? color(
            pbrMetallicRoughness.baseColorFactor[0],
            pbrMetallicRoughness.baseColorFactor[1],
            pbrMetallicRoughness.baseColorFactor[2],
            pbrMetallicRoughness.baseColorFactor[3],
        )
        : DEFAULT_MATERIAL.baseColorFactor;
    const metallicFactor = pbrMetallicRoughness.metallicFactor !== undefined
        ? pbrMetallicRoughness.metallicFactor : DEFAULT_MATERIAL.metallicFactor;
    const roughnessFactor = pbrMetallicRoughness.roughnessFactor !== undefined
        ? pbrMetallicRoughness.roughnessFactor : DEFAULT_MATERIAL.roughnessFactor;
    return {
        baseColorFactor,
        metallicFactor,
        roughnessFactor,
        baseColorTexture: null,
        metallicRoughnessTexture: null,
    };
}

