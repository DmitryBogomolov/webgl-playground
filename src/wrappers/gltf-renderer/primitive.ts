import type { PrimitiveWrapper } from './primitive.types';
import type { GlTFAsset, GlTFSchema } from '../../gltf/asset.types';
import type { GlTF_ACCESSOR_TYPE } from '../../gltf/accessor.types';
import type { GlTF_PRIMITIVE_MODE } from '../../gltf/primitive.types';
import type { Mat4 } from '../../geometry/mat4.types';
import type {
    VertexSchemaDefinition, VERTEX_ATTRIBUTE_TYPE, VertexAttributeDefinition,
} from '../../gl/vertex-schema.types';
import type { Runtime } from '../../gl/runtime';
import { Primitive } from '../../gl/primitive';
import { inversetranspose4x4 } from '../../geometry/mat4';
import { getAccessorType, getAccessorStride, getAccessorBinaryData } from '../../gltf/accessor';
import { getPrimitiveMode } from '../../gltf/primitive';
import { getMaterialInfo } from '../../gltf/material';
import { generateNormals } from './normals';
import { LOCATIONS } from './attr-locations';

const SUPPORTED_PRIMITIVE_MODE: GlTF_PRIMITIVE_MODE = 'triangles';

type TypesSet = Readonly<Partial<Record<GlTF_ACCESSOR_TYPE, boolean>>>;

function makeValidTypes(...types: GlTF_ACCESSOR_TYPE[]): TypesSet {
    const obj: Partial<Record<GlTF_ACCESSOR_TYPE, boolean>> = {};
    for (const type of types) {
        obj[type] = true;
    }
    return obj;
}

const VALID_INDEX_TYPES = makeValidTypes('ubyte', 'ushort', 'uint');
const VALID_POSITION_TYPES = makeValidTypes('float3');
const VALID_NORMAL_TYPES = makeValidTypes('float3');
const VALID_COLOR_TYPES = makeValidTypes('float3', 'float4', 'ubyte3', 'ubyte4', 'ushort3', 'ushort4');
const VALID_TEXCOORD_TYPES = makeValidTypes('float2', 'ubyte2', 'ushort2');

type GLTF_INDEX_TYPE = Extract<GlTF_ACCESSOR_TYPE, 'ubyte' | 'ushort' | 'uint'>;

export function createPrimitive(
    primitive: GlTFSchema.MeshPrimitive,
    transform: Mat4,
    asset: GlTFAsset,
    runtime: Runtime,
): PrimitiveWrapper {
    const {
        POSITION: positionIdx,
        NORMAL: normalIdx,
        COLOR_0: colorIdx,
        TEXCOORD_0: texcoordIdx,
    } = primitive.attributes;
    // For now let's support only triangles.
    if (getPrimitiveMode(primitive) !== SUPPORTED_PRIMITIVE_MODE) {
        throw new Error(`not supported primitive mode: ${getPrimitiveMode(primitive)}`);
    }
    // Though specification allows to have no positions there is no sense in accepting such primitives.
    if (positionIdx === undefined) {
        throw new Error('no POSITION attribute');
    }

    const positionInfo = getAttributeInfo(
        asset,
        positionIdx,
        makeAccessorTypeValidator(VALID_POSITION_TYPES, 'POSITION'),
        noop,
    );
    const indexInfo = primitive.indices !== undefined ? getAttributeInfo(
        asset,
        primitive.indices,
        makeAccessorTypeValidator(VALID_INDEX_TYPES, 'index'),
        noop,
    ) : generateIndexInfo(positionInfo.count);
    const normalInfo = normalIdx !== undefined ? getAttributeInfo(
        asset,
        normalIdx,
        makeAccessorTypeValidator(VALID_NORMAL_TYPES, 'NORMAL'),
        makeAccessorCountValidator(positionInfo.count, 'NORMAL'),
    ) : generateNormalInfo(positionInfo, indexInfo);
    const colorInfo = colorIdx !== undefined ? getAttributeInfo(
        asset,
        colorIdx,
        makeAccessorTypeValidator(VALID_COLOR_TYPES, 'COLOR_0'),
        makeAccessorCountValidator(positionInfo.count, 'COLOR_0'),
    ) : null;
    const texcoordInfo = texcoordIdx !== undefined ? getAttributeInfo(
        asset,
        texcoordIdx,
        makeAccessorTypeValidator(VALID_TEXCOORD_TYPES, 'TEXCOORD_0'),
        makeAccessorCountValidator(positionInfo.count, 'TEXCOORD_0'),
    ) : null;

    const result = new Primitive({ runtime });

    const totalVertexDataSize = calculateTotalSize([positionInfo, normalInfo, colorInfo, texcoordInfo]);
    const vertexAttributes: VertexAttributeDefinition[] = [];
    const vertexSchema: VertexSchemaDefinition = {
        attributes: vertexAttributes,
    };
    const vertexDataCtx: SetVertexDataCtx = {
        data: new Uint8Array(totalVertexDataSize),
        attributes: vertexAttributes,
        offset: 0,
    };

    setVertexData(vertexDataCtx, LOCATIONS.POSITION, positionInfo, undefined);
    setVertexData(vertexDataCtx, LOCATIONS.NORMAL, normalInfo, undefined);
    if (colorInfo) {
        const normalized = colorInfo.type !== 'float3' && colorInfo.type !== 'float4';
        setVertexData(vertexDataCtx, LOCATIONS.COLOR, colorInfo, normalized);
    }
    if (texcoordInfo) {
        const normalized = texcoordInfo.type !== 'float2';
        setVertexData(vertexDataCtx, LOCATIONS.TEXCOORD, texcoordInfo, normalized);
    }
    if (vertexDataCtx.offset !== totalVertexDataSize) {
        throw new Error('data offset mismatch');
    }
    result.setup({
        vertexData: vertexDataCtx.data,
        indexData: indexInfo.data,
        vertexSchema,
        indexType: indexInfo.type as GLTF_INDEX_TYPE,
    });

    const material = getMaterialInfo(asset.gltf, primitive);

    return {
        primitive: result,
        matrix: transform,
        normalMatrix: inversetranspose4x4(transform),
        material,
        description: {
            HAS_COLOR_ATTR: colorInfo ? '1' : '0',
            HAS_TEXCOORD_ATTR: texcoordInfo ? '1' : '0',
            HAS_MATERIAL: material ? '1' : '0',
            HAS_BASE_COLOR_TEXTURE: texcoordInfo
                && material?.baseColorTextureIndex !== undefined ? '1' : '0',
            HAS_METALLIC_ROUGHNESS_TEXTURE: texcoordInfo
                && material?.metallicRoughnessTextureIndex !== undefined ? '1' : '0',
        },
    };
}

interface AttributeInfo {
    readonly type: GlTF_ACCESSOR_TYPE;
    readonly stride: number;
    readonly count: number;
    readonly data: Uint8Array;
}

type TypeValidator = (type: GlTF_ACCESSOR_TYPE) => void;
type CountValidator = (count: number) => void;

function getAttributeInfo(
    asset: GlTFAsset,
    idx: number,
    validateType: TypeValidator,
    validateCount: CountValidator,
): AttributeInfo {
    const accessor = getAccessor(idx, asset);
    validateCount(accessor.count);
    const type = getAccessorType(accessor);
    validateType(type);
    const data = getAccessorBinaryData(asset, accessor);
    const stride = getAccessorStride(asset.gltf, accessor);
    return { type, stride, count: accessor.count, data };
}

function calculateTotalSize(attributes: Iterable<AttributeInfo | null>): number {
    let result = 0;
    for (const attr of attributes) {
        if (attr) {
            result += attr.data.byteLength;
        }
    }
    return result;
}

interface SetVertexDataCtx {
    readonly attributes: VertexAttributeDefinition[];
    readonly data: Uint8Array;
    offset: number;
}

function setVertexData(
    ctx: SetVertexDataCtx, location: number, info: AttributeInfo, normalized: boolean | undefined,
): void {
    ctx.data.set(info.data, ctx.offset);
    ctx.attributes.push({
        location,
        type: info.type as VERTEX_ATTRIBUTE_TYPE,
        offset: ctx.offset,
        stride: info.stride,
        normalized,
    });
    ctx.offset += info.data.byteLength;
}

function noop(): void {
    // Nothing.
}

function makeAccessorTypeValidator(validTypes: TypesSet, name: string): TypeValidator {
    return (type) => {
        if (!validTypes[type]) {
            throw new Error(`bad ${name} type: ${type}`);
        }
    };
}

function makeAccessorCountValidator(matchCount: number, name: string): CountValidator {
    return (count) => {
        if (count !== matchCount) {
            throw new Error(`bad ${name} count: ${count}`);
        }
    };
}

function getAccessor(idx: number, asset: GlTFAsset): GlTFSchema.Accessor {
    const accessor = asset.gltf.accessors?.[idx];
    if (!accessor) {
        throw new Error(`no ${idx} accessor`);
    }
    return accessor;
}

function generateIndexInfo(count: number): AttributeInfo {
    const arr = new Uint16Array(count);
    for (let i = 0; i < arr.length; ++i) {
        arr[i] = i;
    }
    return {
        type: 'ushort',
        count,
        stride: 0,
        data: new Uint8Array(arr.buffer),
    };
}

function generateNormalInfo(positionInfo: AttributeInfo, indexInfo: AttributeInfo): AttributeInfo {
    return {
        type: 'float3',
        count: positionInfo.count,
        stride: 12,
        data: generateNormals(positionInfo.data, indexInfo.data, indexInfo.type),
    };
}
