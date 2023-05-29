export type GlTFDescriptionItem = string | number | GlTFDescriptionMap;

export interface GlTFDescriptionMap {
    readonly [key: string]: GlTFDescriptionItem;
}

export interface GlTFAsset {
    readonly desc: GlTFDescriptionMap;
    readonly data: ArrayBuffer;
}
