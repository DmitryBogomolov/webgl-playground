export type AttributeType = ('byte' | 'ubyte' | 'short' | 'ushort' | 'float');
export type AttributeTypeMap<T> = { readonly [key in AttributeType]: T };

export type AttributeTypeOption = (
    | 'byte1' | 'byte2' | 'byte3' | 'byte4'
    | 'ubyte1' | 'ubyte2' | 'ubyte3' | 'ubyte4'
    | 'short1' | 'short2' | 'short3' | 'short4'
    | 'ushort1' | 'ushort2' | 'ushort3' | 'ushort4'
    | 'float1' | 'float2' | 'float3' | 'float4'
);

export interface AttributeOptions {
    readonly name: string;
    /** byte[1234] ubyte[1234] short[1234] ushort[1234] float[1234] */
    readonly type: AttributeTypeOption;
    readonly normalized?: boolean;
    readonly offset?: number;
    readonly stride?: number;
}

export interface Attribute {
    readonly name: string;
    readonly location: number;
    readonly type: AttributeType;
    readonly size: number;
    readonly normalized: boolean;
    readonly stride: number;
    readonly offset: number;
    readonly gltype: number;
}

export interface VertexSchema {
    readonly attributes: ReadonlyArray<Attribute>;
    readonly totalSize: number;
}
