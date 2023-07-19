import type { Mapping } from '../../common/mapping.types';

export interface GlTFRendererRawData {
    readonly data: ArrayBufferView;
    readonly additionalData?: Mapping<string, ArrayBufferView>;
}

export interface GlTFRendererUrlData {
    readonly url: string;
}

export type GlTFRendererData = (
    | GlTFRendererRawData
    | GlTFRendererUrlData
);
