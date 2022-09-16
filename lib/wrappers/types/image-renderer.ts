export interface ImageRendererRawImageData {
    readonly data: ArrayBufferView;
}
export interface ImageRendererUrlImageData {
    readonly url: string;
}
export type ImageRendererImageData = ImageRendererRawImageData | ImageRendererUrlImageData;
