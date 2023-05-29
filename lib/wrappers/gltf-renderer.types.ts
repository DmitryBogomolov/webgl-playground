export interface GlTFRendererRawData {
    readonly data: ArrayBufferView;
}

export interface GlTFRendererUrlData {
    readonly url: string;
}

export type GlTFRendererData = (
    | GlTFRendererRawData
    | GlTFRendererUrlData
);
