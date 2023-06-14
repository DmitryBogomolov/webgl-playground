export interface GlTFRendererRawData {
    readonly data: ArrayBufferView;
    readonly additionalData?: Readonly<Record<string, ArrayBufferView>>;
}

export interface GlTFRendererUrlData {
    readonly url: string;
}

export type GlTFRendererData = (
    | GlTFRendererRawData
    | GlTFRendererUrlData
);
