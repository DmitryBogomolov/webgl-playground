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

export interface ImageRendererRegion {
    /** Offset from the left side of screen / texture */
    readonly x1?: number;
    /** Offset from the right side of screen / texture */
    readonly x2?: number;
    /** Offset from the bottom side of screen / texture */
    readonly y1?: number;
    /** Offset from the top side of screen / texture */
    readonly y2?: number;
    /** Rotation */
    readonly rotation?: number;
}

export interface ImageRendererLocation extends ImageRendererRegion {
    /** Width */
    readonly width?: number;
    /** Height */
    readonly height?: number;
}
