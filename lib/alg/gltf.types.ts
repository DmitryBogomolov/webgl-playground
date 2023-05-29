import type { GlTf } from './gltf-schema.types';

export interface GlTFAsset {
    readonly desc: GlTf;
    readonly data: ArrayBuffer;
}
