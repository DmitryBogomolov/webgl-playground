import type { Mapping } from '../../common/mapping.types';
import type { BaseObjectParams } from '../../gl/base-object.types';
import type { Runtime } from '../../gl/runtime';

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

export interface GlTFRendererParams extends BaseObjectParams {
    readonly runtime: Runtime;
}
