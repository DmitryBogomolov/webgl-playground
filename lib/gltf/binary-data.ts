import type { GlTFAsset } from './asset.types';

export function getBinaryData(
    asset: GlTFAsset, idx: number, byteOffset: number, byteLength: number | undefined,
): Uint8Array {
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
