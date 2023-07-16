import type * as GlTFSchema from './schema.types';

export type { GlTFSchema };

export interface GlTFAsset {
    readonly gltf: GlTFSchema.GlTf;
    readonly buffers: ReadonlyMap<number, ArrayBuffer>;
    readonly images: ReadonlyMap<number, ArrayBuffer>;
}
