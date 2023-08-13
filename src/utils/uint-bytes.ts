import type { Vec4 } from '../geometry/vec4.types';
import { vec4 } from '../geometry/vec4';

export function uint2bytes(value: number): Vec4 {
    return vec4(
        ((value >>> 0) & 0xFF),
        ((value >>> 8) & 0xFF),
        ((value >>> 16) & 0xFF),
        ((value >>> 24) & 0xFF),
    );
}

export function bytes2uint(bytes: Vec4): number {
    return ((bytes.x << 0) | (bytes.y << 8) | (bytes.z << 16) | (bytes.w << 24)) >>> 0;
}
