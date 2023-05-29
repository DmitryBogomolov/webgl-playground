import type * as GlTFSchema from './gltf-schema.types';

export type { GlTFSchema };

export interface GlTFAsset {
    readonly desc: GlTFSchema.GlTf;
    readonly data: ArrayBuffer;
}
