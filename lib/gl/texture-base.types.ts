import type { Vec2 } from '../geometry/vec2.types';
import type { Runtime } from './runtime';

export type TEXTURE_WRAP = ('repeat' | 'clamp_to_edge');
export type TEXTURE_MAG_FILTER = ('nearest' | 'linear');
export type TEXTURE_MIN_FILTER = (
    | 'nearest' | 'linear'
    | 'nearest_mipmap_nearest' | 'linear_mipmap_nearest' | 'nearest_mipmap_linear' | 'linear_mipmap_linear'
);

export type TEXTURE_FORMAT = (
    | 'rgba' | 'rgb' | 'luminance' | 'alpha' | 'luminance_alpha'
    | 'depth_component16' | 'depth_component32' | 'depth_stencil'
);

export interface TextureParameters {
    readonly wrap_s?: TEXTURE_WRAP;
    readonly wrap_t?: TEXTURE_WRAP;
    readonly mag_filter?: TEXTURE_MAG_FILTER;
    readonly min_filter?: TEXTURE_MIN_FILTER;
}

export interface TextureImageDataOptions {
    readonly unpackFlipY?: boolean;
    readonly unpackPremultiplyAlpha?: boolean;
    readonly generateMipmap?: boolean;
    readonly format?: TEXTURE_FORMAT;
}

export interface TextureRawImageData {
    readonly size: Vec2;
    readonly data: ArrayBufferView | null;
}

export type TextureImageData = TextureRawImageData | TexImageSource;

export type TextureRuntimeBase = Pick<
    Runtime,
    'gl' | 'logger' | 'setPixelStoreUnpackFlipYWebgl' | 'setPixelStoreUnpackPremultiplyAlphaWebgl'
>;
