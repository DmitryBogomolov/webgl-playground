export type PRIMITIVE_MODE = (
    'points' | 'line_strip' | 'line_loop' | 'lines' | 'triangle_strip' | 'triangle_fan' | 'triangles'
);

export type INDEX_TYPE = (
    'u8' | 'u16' | 'u32'
);

export interface IndexData {
    readonly indexCount: number;
    readonly indexOffset?: number;
    readonly indexType?: INDEX_TYPE;
    readonly primitiveMode?: PRIMITIVE_MODE;
}
