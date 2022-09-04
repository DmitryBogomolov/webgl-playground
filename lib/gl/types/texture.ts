export type TEXTURE_WRAP = ('repeat' | 'clamp_to_edge');
export type TEXTURE_MAG_FILTER = ('nearest' | 'linear');
export type TEXTURE_MIN_FILTER = (
    | 'nearest' | 'linear'
    | 'nearest_mipmap_nearest' | 'linear_mipmap_nearest' | 'nearest_mipmap_linear' | 'linear_mipmap_linear'
);

export type TEXTURE_FORMAT = ('rgba' | 'rgb' | 'luminance' | 'alpha' | 'luminance_alpha');

export interface TextureParameters {
    readonly wrap_s?: TEXTURE_WRAP;
    readonly wrap_t?: TEXTURE_WRAP;
    readonly mag_filter?: TEXTURE_MAG_FILTER;
    readonly min_filter?: TEXTURE_MIN_FILTER;
}

export interface ImageDataOptions {
    readonly unpackFlipY?: boolean;
    readonly generateMipmap?: boolean;
    readonly format?: TEXTURE_FORMAT;
}

export interface TextureData {
    readonly size: readonly [number, number];
    readonly data: ArrayBufferView | null;
}
