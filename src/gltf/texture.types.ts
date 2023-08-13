export type GlTF_MIN_FILTER = (
    | 'linear' | 'nearest'
    | 'nearest_mipmap_nearest' | 'linear_mipmap_nearest' | 'nearest_mipmap_linear' | 'linear_mipmap_linear'
);

export type GlTF_MAG_FILTER = (
    'linear' | 'nearest'
);

export type GlTF_WRAP = (
    'repeat' | 'mirrored_repeat' | 'clamp_to_edge'
);

export interface GlTFTextureSampler {
    readonly minFilter?: GlTF_MIN_FILTER;
    readonly magFilter?: GlTF_MAG_FILTER;
    readonly wrapS: GlTF_WRAP;
    readonly wrapT: GlTF_WRAP;
}

export interface GlTFTexture {
    readonly data: Uint8Array;
    readonly mimeType: string;
    readonly sampler: GlTFTextureSampler;
}
