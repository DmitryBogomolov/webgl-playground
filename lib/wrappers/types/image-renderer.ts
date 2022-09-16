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
