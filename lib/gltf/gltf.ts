import type {
    GlTFAsset, GlTFResolveUriFunc, GlTFSchema,
    GlTF_ACCESSOR_TYPE, GlTF_PRIMITIVE_MODE, GlTFMaterial,
    GlTF_MIN_FILTER, GlTF_MAG_FILTER, GlTF_WRAP, GlTFTexture, GlTFTextureSampler,
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
    let gltf = tryParseJson(data);
    const buffers = new Map<number, ArrayBuffer>();
    const images = new Map<number, ArrayBuffer>();
    if (!gltf) {
        const parsedGlb = parseGlb(data);
        gltf = parsedGlb.gltf;
        if (parsedGlb.buffer) {
            buffers.set(0, parsedGlb.buffer);
        }
    }
    return resolveReferences(gltf, buffers, images, resolveUri || defaultResolveUri).then(() => ({
        gltf: gltf!,
        buffers,
        images,
    }));
}

const defaultResolveUri: GlTFResolveUriFunc = (uri) => {
    return Promise.reject(new Error(`cannot resolve ${uri}`));
};

function tryParseJson(data: ArrayBufferView): GlTFSchema.GlTf | null {
    const view = new Uint8Array(data.buffer, data.byteOffset, 1);
    const first = view[0];
    // Lightweight guess that it is JSON content.
    if (first !== '\n'.charCodeAt(0) && first !== '{'.charCodeAt(0)) {
        return null;
    }
    try {
        return decodeJson(data, 0, data.byteLength);
    } catch {
        return null;
    }
}

function parseGlb(data: ArrayBufferView): { gltf: GlTFSchema.GlTf, buffer: ArrayBuffer | null } {
    const arr = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const totalLength = readHeader(arr);
    if (totalLength !== arr.length) {
        throw new Error(`bad length: ${totalLength} / data length ${arr.length}`);
    }

    const jsonOffset = 12;
    const jsonChunkLength = readU32(arr, jsonOffset + 0);
    const jsonChunkType = readU32(arr, jsonOffset + 4);
    if (jsonChunkType !== CHUNK_JSON) {
        return { gltf: { asset: { version: '' } }, buffer: null };
    }
    const jsonChunk = decodeJson(data, jsonOffset + 8, jsonChunkLength);

    const binaryOffset = jsonOffset + 8 + jsonChunkLength;
    if (binaryOffset >= totalLength) {
        checkNoBuffers(jsonChunk);
        return { gltf: jsonChunk, buffer: null };
    }
    const binaryChunkLength = readU32(arr, binaryOffset + 0);
    const binaryChunkType = readU32(arr, binaryOffset + 4);
    if (binaryChunkType !== CHUNK_BIN) {
        checkNoBuffers(jsonChunk);
        return { gltf: jsonChunk, buffer: null };
    }
    const binaryChunk = extractBinary(data, binaryOffset + 8, binaryChunkLength);
    checkSingleBuffer(jsonChunk, binaryChunk);
    return { gltf: jsonChunk, buffer: binaryChunk };
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

function resolveReferences(
    gltf: GlTFSchema.GlTf, resolvedBuffers: Map<number, ArrayBuffer>, resolvedImages: Map<number, ArrayBuffer>,
    resolveUri: GlTFResolveUriFunc,
): Promise<void> {
    const errors: Error[] = [];
    const { buffers, images } = gltf;
    const tasks: Promise<void>[] = [];
    if (buffers) {
        for (let i = 0; i < buffers.length; ++i) {
            const { uri } = buffers[i];
            if (uri) {
                tasks.push(resolveReference(uri, i, resolvedBuffers, errors, resolveUri));
            }
        }
    }
    if (images) {
        for (let i = 0; i < images.length; ++i) {
            const { uri } = images[i];
            if (uri) {
                tasks.push(resolveReference(uri, i, resolvedImages, errors, resolveUri));
            }
        }
    }
    return Promise.all(tasks).then(() => {
        if (errors.length > 0) {
            const msg = errors.map((err) => err.message).join('; ');
            throw new Error(msg);
        }
    });
}

function resolveDataUri(uri: string): Promise<ArrayBufferView> {
    return fetch(uri)
        .then((res) => res.arrayBuffer())
        .then((buf) => new Uint8Array(buf));
}

const DATA_URI_PREFIX = 'data:';

function resolveReference(
    uri: string, idx: number, buffers: Map<number, ArrayBuffer>, errors: Error[], resolveUri: GlTFResolveUriFunc,
): Promise<void> {
    const resolve = uri.startsWith(DATA_URI_PREFIX) ? resolveDataUri : resolveUri;
    return resolve(uri).then(
        (data) => {
            const buf = new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice().buffer;
            buffers.set(idx, buf);
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

function getBufferData(asset: GlTFAsset, idx: number, byteOffset: number, byteLength: number | undefined): Uint8Array {
    const bufferView = asset.gltf.bufferViews![idx];
    const buffer = asset.gltf.buffers![bufferView.buffer];
    const offset = (bufferView.byteOffset || 0) + byteOffset;
    const length = byteLength || bufferView.byteLength;
    if (offset + length > buffer.byteLength) {
        throw new Error(`offset ${length} and length ${length} mismatch buffer size ${buffer.byteLength}`);
    }
    if (length > bufferView.byteLength) {
        throw new Error(`length ${length} mismatch buffer view length ${bufferView.byteLength}`);
    }
    const rawBuffer = asset.buffers.get(bufferView.buffer)!;
    return new Uint8Array(rawBuffer, offset, length);
}

export function getAccessorData(asset: GlTFAsset, accessor: GlTFSchema.Accessor): Uint8Array {
    const byteOffset = accessor.byteOffset || 0;
    const byteLength = accessor.count * getAccessorStride(asset, accessor);
    return getBufferData(asset, accessor.bufferView!, byteOffset, byteLength);
}

const DEFAULT_BASE_COLOR_FACTOR = color(1, 1, 1, 1);
const DEFAULT_METALLIC_FACTOR = 1;
const DEFAULT_ROUGHNESS_FACTOR = 1;

export function getPrimitiveMaterial(asset: GlTFAsset, primitive: GlTFSchema.MeshPrimitive): GlTFMaterial | null {
    if (primitive.material === undefined) {
        return null;
    }
    const { pbrMetallicRoughness: pbr } = asset.gltf.materials![primitive.material];
    if (!pbr) {
        return null;
    }
    const baseColorFactor = pbr.baseColorFactor !== undefined
        ? color(...pbr.baseColorFactor as [number, number, number, number])
        : DEFAULT_BASE_COLOR_FACTOR;
    const metallicFactor = pbr.metallicFactor !== undefined
        ? pbr.metallicFactor
        : DEFAULT_METALLIC_FACTOR;
    const roughnessFactor = pbr.roughnessFactor !== undefined
        ? pbr.roughnessFactor
        : DEFAULT_ROUGHNESS_FACTOR;
    const baseColorTextureIndex = pbr.baseColorTexture
        ? pbr.baseColorTexture.index
        : undefined;
    const metallicRoughnessTextureIndex = pbr.metallicRoughnessTexture
        ? pbr.metallicRoughnessTexture.index
        : undefined;
    return {
        baseColorFactor,
        metallicFactor,
        roughnessFactor,
        baseColorTextureIndex,
        metallicRoughnessTextureIndex,
    };
}

const MIN_FILTER_MAPPING: Readonly<Record<number, GlTF_MIN_FILTER>> = {
    [9728]: 'nearest',
    [9729]: 'linear',
    [9984]: 'nearest_mipmap_nearest',
    [9985]: 'linear_mipmap_nearest',
    [9986]: 'nearest_mipmap_linear',
    [9987]: 'linear_mipmap_linear',
};
const MAG_FILTER_MAPPING: Readonly<Record<number, GlTF_MAG_FILTER>> = {
    [9728]: 'nearest',
    [9729]: 'linear',
};
const WRAP_MAPPING: Readonly<Record<number, GlTF_WRAP>> = {
    [10497]: 'repeat',
    [33071]: 'clamp_to_edge',
    [33648]: 'mirrored_repeat',
};

const DEFAULT_SAMPLER: GlTFTextureSampler = {
    wrapS: 'repeat',
    wrapT: 'repeat',
};

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#texture-data
export function getTextureData(asset: GlTFAsset, idx: number): GlTFTexture {
    const texture = asset.gltf.textures![idx];
    const image = asset.gltf.images![texture.source!];
    let data: Uint8Array;
    if (image.bufferView !== undefined) {
        data = getBufferData(asset, image.bufferView, 0, undefined);
    } else {
        const buffer = asset.images.get(texture.source!)!;
        data = new Uint8Array(buffer);
    }
    const mimeType = image.mimeType !== undefined ? image.mimeType as string : detectTextureMimeType(data);
    let sampler: GlTFTextureSampler;
    if (texture.sampler !== undefined) {
        const { wrapS, wrapT, minFilter, magFilter } = asset.gltf.samplers![texture.sampler];
        sampler = {
            wrapS: wrapS !== undefined ? WRAP_MAPPING[wrapS] : DEFAULT_SAMPLER.wrapS,
            wrapT: wrapT !== undefined ? WRAP_MAPPING[wrapT] : DEFAULT_SAMPLER.wrapT,
            minFilter: minFilter !== undefined ? MIN_FILTER_MAPPING[minFilter] : undefined,
            magFilter: magFilter !== undefined ? MAG_FILTER_MAPPING[magFilter] : undefined,
        };
    } else {
        sampler = { ...DEFAULT_SAMPLER };
    }
    return {
        data,
        mimeType,
        sampler,
    };
}

const PNG_PATTERN: ReadonlyArray<number> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const JPEG_PATTERN: ReadonlyArray<number> = [0xFF, 0xD8, 0xFF];

function matchPattern(data: Uint8Array, pattern: ReadonlyArray<number>): boolean {
    for (let i = 0; i < pattern.length; ++i) {
        if (pattern[i] !== data[i]) {
            return false;
        }
    }
    return true;
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images
function detectTextureMimeType(data: Uint8Array): string {
    if (matchPattern(data, PNG_PATTERN)) {
        return 'image/png';
    }
    if (matchPattern(data, JPEG_PATTERN)) {
        return 'image/jpeg';
    }
    throw new Error('mime type not detected');
}
