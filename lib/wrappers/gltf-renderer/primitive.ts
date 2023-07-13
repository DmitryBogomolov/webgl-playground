import type { PrimitiveWrapper } from './primitive.types';
import type { GlTFAsset, GlTFSchema } from '../../gltf/asset.types';
import type { GlTF_ACCESSOR_TYPE } from '../../gltf/accessor.types';
import type { GlTF_PRIMITIVE_MODE } from '../../gltf/primitive.types';
import type { Mat4 } from '../../geometry/mat4.types';
import type { AttributeOptions, ATTRIBUTE_TYPE } from '../../gl/vertex-schema.types';
import type { INDEX_TYPE } from '../../gl/primitive.types';
import type { Runtime } from '../../gl/runtime';
import type { DisposableContextProxy } from '../../utils/disposable-context.types';
import { Primitive } from '../../gl/primitive';
import { Program } from '../../gl/program';
import { parseVertexSchema } from '../../gl/vertex-schema';
import { inversetranspose4x4 } from '../../geometry/mat4';
import { getAccessorType, getAccessorStride, getAccessorBinaryData } from '../../gltf/accessor';
import { getPrimitiveMode } from '../../gltf/primitive';
import { getMaterialInfo } from '../../gltf/material';
import { makeShaderSource } from './shader-source';
import { generateNormals } from './normals';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

const SUPPORTED_PRIMITIVE_MODE: GlTF_PRIMITIVE_MODE = 'triangles';
const VALID_INDEX_TYPES: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
    ['ubyte1', 'ushort1', 'uint1'],
);
const VALID_POSITION_TYPE: GlTF_ACCESSOR_TYPE = 'float3';
const VALID_NORMAL_TYPE: GlTF_ACCESSOR_TYPE = 'float3';
const VALID_COLOR_TYPES: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
    ['float3', 'float4', 'ubyte3', 'ubyte4', 'ushort3', 'ushort4'],
);
const VALID_TEXCOORD_TYPE: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
    ['float2', 'ubyte2', 'ushort2'],
);

export function createPrimitive(
    primitive: GlTFSchema.MeshPrimitive, transform: Mat4,
    asset: GlTFAsset, runtime: Runtime, context: DisposableContextProxy,
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

    const positionInfo = getAttributeInfo(asset, positionIdx, validatePositionType, noop);
    const indexInfo = primitive.indices !== undefined
        ? getAttributeInfo(asset, primitive.indices, validateIndexType, noop)
        : generateIndexInfo(positionInfo.count);
    const normalInfo = normalIdx !== undefined
        ? getAttributeInfo(
            asset, normalIdx,
            validateNormalType, (count) => validateAccessorCount(count, positionInfo.count, 'NORMAL'),
        )
        : generateNormalInfo(positionInfo, indexInfo)
    const colorInfo = colorIdx !== undefined
        ? getAttributeInfo(
            asset, colorIdx,
            validateColorType, (count) => validateAccessorCount(count, positionInfo.count, 'COLOR_0'),
        )
        : null;
    const texcoordInfo = texcoordIdx !== undefined
        ? getAttributeInfo(
            asset, texcoordIdx,
            validateTexcoordType, (count) => validateAccessorCount(count, positionInfo.count, 'TEXCOORD_0'),
        )
        : null;

    let totalVertexDataSize = positionInfo.data.byteLength + normalInfo.data.byteLength;
    if (colorInfo) {
        totalVertexDataSize += colorInfo.data.byteLength;
    }
    if (texcoordInfo) {
        totalVertexDataSize += texcoordInfo.data.byteLength;
    }

    const result = new Primitive(runtime);
    context.add(result);

    result.allocateVertexBuffer(totalVertexDataSize);
    const vertexAttributes: AttributeOptions[] = [];
    let vertexDataOffset = 0;

    result.updateVertexData(positionInfo.data, vertexDataOffset);
    vertexAttributes.push({
        name: 'a_position',
        type: positionInfo.type as ATTRIBUTE_TYPE,
        offset: vertexDataOffset,
        stride: positionInfo.stride
    });
    vertexDataOffset += positionInfo.data.byteLength;

    result.updateVertexData(normalInfo.data, vertexDataOffset);
    vertexAttributes.push({
        name: 'a_normal',
        type: normalInfo.type as ATTRIBUTE_TYPE,
        offset: vertexDataOffset,
        stride: normalInfo.stride
    });
    vertexDataOffset += normalInfo.data.byteLength;

    if (colorInfo) {
        result.updateVertexData(colorInfo.data, vertexDataOffset);
        vertexAttributes.push({
            name: 'a_color',
            type: colorInfo.type as ATTRIBUTE_TYPE,
            normalized: colorInfo.type !== 'float3' && colorInfo.type !== 'float4',
            offset: vertexDataOffset,
            stride: colorInfo.stride,
        });
        vertexDataOffset += colorInfo.data.byteLength;
    }

    if (texcoordInfo) {
        result.updateVertexData(texcoordInfo.data, vertexDataOffset);
        vertexAttributes.push({
            name: 'a_texcoord',
            type: texcoordInfo.type as ATTRIBUTE_TYPE,
            normalized: texcoordInfo.type !== 'float2',
            offset: vertexDataOffset,
            stride: texcoordInfo.stride,
        });
        vertexDataOffset += texcoordInfo.data.byteLength;
    }

    const schema = parseVertexSchema(vertexAttributes);
    result.setVertexSchema(schema);

    result.allocateIndexBuffer(indexInfo.data.byteLength);
    result.updateIndexData(indexInfo.data);
    result.setIndexConfig({
        indexCount: indexInfo.count,
        indexType: INDEX_TYPE_TO_TYPE[indexInfo.type as GLTF_INDEX_TYPE],
        primitiveMode: 'triangles',
    });

    const material = getMaterialInfo(asset, primitive);

    // TODO: Share program between all primitives (some schema check should be updated?).
    const programDefinitions = {
        HAS_COLOR_ATTR: colorInfo ? '1' : '0',
        HAS_TEXCOORD_ATTR: texcoordIdx ? '1' : '0',
        HAS_MATERIAL: material ? '1' : '0',
        HAS_BASE_COLOR_TEXTURE: !!texcoordInfo
            && material?.baseColorTextureIndex !== undefined ? '1' : '0',
        HAS_METALLIC_ROUGHNESS_TEXTURE: !!texcoordInfo
            && material?.metallicRoughnessTextureIndex !== undefined ? '1' : '0',
    };
    const program = new Program(runtime, {
        schema,
        vertShader: makeShaderSource(vertShader, programDefinitions),
        fragShader: makeShaderSource(fragShader, programDefinitions),
    });
    context.add(program);
    result.setProgram(program);

    return {
        primitive: result,
        matrix: transform,
        normalMatrix: inversetranspose4x4(transform),
        material,
    };
}

interface AttributeInfo {
    readonly type: GlTF_ACCESSOR_TYPE;
    readonly stride: number;
    readonly count: number;
    readonly data: Uint8Array;
}

function getAttributeInfo(
    asset: GlTFAsset, idx: number,
    validateType: (t: GlTF_ACCESSOR_TYPE) => void, validateCount: (c: number) => void,
): AttributeInfo {
    const accessor = getAccessor(idx, asset);
    validateCount(accessor.count);
    const type = getAccessorType(accessor);
    validateType(type);
    const data = getAccessorBinaryData(asset, accessor);
    const stride = getAccessorStride(asset.gltf, accessor);
    return { type, stride, count: accessor.count, data };
}

function noop(): void {
    // Nothing.
}

function validatePositionType(type: GlTF_ACCESSOR_TYPE): void {
    if (type !== VALID_POSITION_TYPE) {
        throw new Error(`bad POSITION type: ${type}`);
    }
}

function validateIndexType(type: GlTF_ACCESSOR_TYPE): void {
    if (!VALID_INDEX_TYPES.has(type)) {
        throw new Error(`bad index type: ${type}`);
    }
}

function validateNormalType(type: GlTF_ACCESSOR_TYPE): void {
    if (type !== VALID_NORMAL_TYPE) {
        throw new Error(`bad NORMAL type: ${type}`);
    }
}

function validateColorType(type: GlTF_ACCESSOR_TYPE): void {
    if (!VALID_COLOR_TYPES.has(type)) {
        throw new Error(`bad COLOR_0 type: ${type}`);
    }
}

function validateTexcoordType(type: GlTF_ACCESSOR_TYPE): void {
    if (!VALID_TEXCOORD_TYPE.has(type)) {
        throw new Error(`bad TEXCOORD_0 type: ${type}`);
    }
}

function validateAccessorCount(count: number, matchCount: number, name: string): void {
    if (count !== matchCount) {
        throw new Error(`bad ${name} count: ${count}`);
    }
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
        type: 'ushort1',
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

type GLTF_INDEX_TYPE = Extract<GlTF_ACCESSOR_TYPE, 'ubyte1' | 'ushort1' | 'uint1'>;

const INDEX_TYPE_TO_TYPE: Readonly<Record<GLTF_INDEX_TYPE, INDEX_TYPE>> = {
    'ubyte1': 'u8',
    'ushort1': 'u16',
    'uint1': 'u32',
};
