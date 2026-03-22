import type { Vec4 } from '../geometry/vec4.types';

export function uint2bytes(value: number): Vec4 {
    return {
        x: ((value >>> 0) & 0xFF),
        y: ((value >>> 8) & 0xFF),
        z: ((value >>> 16) & 0xFF),
        w: ((value >>> 24) & 0xFF),
    };
}

export function bytes2uint(bytes: Vec4): number {
    return ((bytes.x << 0) | (bytes.y << 8) | (bytes.z << 16) | (bytes.w << 24)) >>> 0;
}
