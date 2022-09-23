import type { Vec2 } from '../../geometry/types/vec2';

export interface ImageRendererRawImageData {
    readonly size: Vec2;
    readonly data: ArrayBufferView;
}
export interface ImageRendererUrlImageData {
    readonly url: string;
}
export type ImageRendererImageData = (
    | ImageRendererRawImageData
    | ImageRendererUrlImageData
    | TexImageSource
);

export interface ImageRendererLocation {
    readonly x1?: number;
    readonly x2?: number;
    readonly y1?: number;
    readonly y2?: number;
    readonly rotation?: number;
}
