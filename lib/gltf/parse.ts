import type { GlTFResolveUriFunc } from './parse.types';
import type { GlTFAsset, GlTFSchema } from './asset.types';

const MAGIC = 0x46546C67;
const CHUNK_JSON = 0x4E4F534A;
const CHUNK_BIN = 0x004E4942;

export const GLTF_MEDIA_TYPE = 'model/gltf+json';
export const GLB_MEDIA_TYPE = 'model/gltf-binary';

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification
export async function parseGlTF(data: ArrayBufferView, resolveUri?: GlTFResolveUriFunc): Promise<GlTFAsset> {
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
    await resolveReferences(gltf, buffers, images, resolveUri || defaultResolveUri);
    return {
        gltf,
        buffers,
        images,
    };
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

async function resolveReferences(
    gltf: GlTFSchema.GlTf,
    resolvedBuffers: Map<number, ArrayBuffer>, resolvedImages: Map<number, ArrayBuffer>,
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
    await Promise.all(tasks);
    if (errors.length > 0) {
        const msg = errors.map((err) => err.message).join('; ');
        throw new Error(msg);
    }
}

async function resolveDataUri(uri: string): Promise<ArrayBufferView> {
    // Not an actual network request.
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
}

const DATA_URI_PREFIX = 'data:';

async function resolveReference(
    uri: string, idx: number, buffers: Map<number, ArrayBuffer>, errors: Error[],
    resolveUri: GlTFResolveUriFunc,
): Promise<void> {
    const resolve = uri.startsWith(DATA_URI_PREFIX) ? resolveDataUri : resolveUri;
    try {
        const data = await resolve(uri);
        const buf = new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice().buffer;
        buffers.set(idx, buf);
    } catch (err) {
        errors.push(err as Error);
    }
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
