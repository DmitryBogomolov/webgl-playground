export interface GlbRendererRawData {
    readonly data: ArrayBufferView;
}

export interface GlbRendererUrlData {
    readonly url: string;
}

export type GlbRendererData = (
    | GlbRendererRawData
    | GlbRendererUrlData
);
