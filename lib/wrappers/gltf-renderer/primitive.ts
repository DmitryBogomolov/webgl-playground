import type { GlTFAsset, GlTFSchema } from '../../gltf/asset.types';
import type { GlTF_ACCESSOR_TYPE } from '../../gltf/accessor.types';
import type { GlTF_PRIMITIVE_MODE } from '../../gltf/primitive.types';
import type { GlTFMaterial } from '../../gltf/material.types';
import type { Mat4 } from '../../geometry/mat4.types';
import type { AttributeOptions, ATTRIBUTE_TYPE } from '../../gl/vertex-schema.types';
import type { INDEX_TYPE } from '../../gl/primitive.types';
import type { Runtime } from '../../gl/runtime';
import type { DisposableContext } from '../../utils/disposable-context';
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

export interface PrimitiveWrapper {
    readonly primitive: Primitive;
    readonly matrix: Mat4;
    readonly normalMatrix: Mat4;
    readonly material: GlTFMaterial | null;
}

export function createPrimitive(
    primitive: GlTFSchema.MeshPrimitive, transform: Mat4,
    asset: GlTFAsset, runtime: Runtime, context: DisposableContext,
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
    const positionAccessor = getAccessor(positionIdx, asset);
    if (getAccessorType(positionAccessor) !== VALID_POSITION_TYPE) {
        throw new Error(`bad POSITION type: ${getAccessorType(positionAccessor)}`);
    }
    const positionData = getAccessorBinaryData(asset, positionAccessor);
    const positionStride = getAccessorStride(asset.gltf, positionAccessor);

    let indicesType: GlTF_ACCESSOR_TYPE;
    let indicesCount: number;
    let indicesData: Uint8Array;
    if (primitive.indices !== undefined) {
        const indicesAccessor = getAccessor(primitive.indices, asset);
        indicesType = getAccessorType(indicesAccessor);
        if (!VALID_INDEX_TYPES.has(indicesType)) {
            throw new Error(`bad index type: ${indicesType}`);
        }
        indicesCount = indicesAccessor.count;
        indicesData = getAccessorBinaryData(asset, indicesAccessor);
    } else {
        indicesType = 'ushort1';
        indicesCount = positionAccessor.count;
        indicesData = generateIndices(positionAccessor.count);
    }

    let normalData: Uint8Array;
    let normalStride: number;
    if (normalIdx !== undefined) {
        const normalAccessor = getAccessor(normalIdx, asset);
        if (getAccessorType(normalAccessor) !== VALID_NORMAL_TYPE) {
            throw new Error(`bad NORMAL type: ${getAccessorType(normalAccessor)}`);
        }
        if (normalAccessor.count !== positionAccessor.count) {
            throw new Error(`bad NORMAL count: ${normalAccessor.count}`);
        }
        normalData = getAccessorBinaryData(asset, normalAccessor);
        normalStride = getAccessorStride(asset.gltf, normalAccessor);
    } else {
        normalData = generateNormals(positionData, indicesData, indicesType);
        normalStride = 12;
    }

    let colorType: GlTF_ACCESSOR_TYPE | undefined;
    let colorData: Uint8Array | undefined;
    let colorStride: number | undefined;
    if (colorIdx !== undefined) {
        const colorAccessor = getAccessor(colorIdx, asset);
        colorType = getAccessorType(colorAccessor);
        if (!VALID_COLOR_TYPES.has(colorType)) {
            throw new Error(`bad COLOR_0 type: ${colorType}`);
        }
        if (colorAccessor.count !== positionAccessor.count) {
            throw new Error(`bad COLOR_0 count: ${colorAccessor.count}`);
        }
        colorData = getAccessorBinaryData(asset, colorAccessor);
        colorStride = getAccessorStride(asset.gltf, colorAccessor);
    }

    let texcoordType: GlTF_ACCESSOR_TYPE | undefined;
    let texcoordData: Uint8Array | undefined;
    let texcoordStride: number | undefined;
    if (texcoordIdx !== undefined) {
        const texcoordAccessor = getAccessor(texcoordIdx, asset);
        texcoordType = getAccessorType(texcoordAccessor);
        if (!VALID_TEXCOORD_TYPE.has(texcoordType)) {
            throw new Error(`bad TEXCOORD_0 type: ${texcoordType}`);
        }
        if (texcoordAccessor.count !== positionAccessor.count) {
            throw new Error(`bad TEXCOORD_0 count: ${texcoordAccessor.count}`);
        }
        texcoordData = getAccessorBinaryData(asset, texcoordAccessor);
        texcoordStride = getAccessorStride(asset.gltf, texcoordAccessor);
    }

    let totalVertexDataSize = positionData.byteLength + normalData.byteLength;
    if (colorData) {
        totalVertexDataSize += colorData.byteLength;
    }
    if (texcoordData) {
        totalVertexDataSize += texcoordData.byteLength;
    }

    const result = new Primitive(runtime);
    context.add(result);

    result.allocateVertexBuffer(totalVertexDataSize);
    const vertexAttributes: AttributeOptions[] = [];
    let vertexDataOffset = 0;

    result.updateVertexData(positionData, vertexDataOffset);
    vertexAttributes.push(
        { name: 'a_position', type: 'float3', offset: vertexDataOffset, stride: positionStride },
    );
    vertexDataOffset += positionData.byteLength;

    result.updateVertexData(normalData, vertexDataOffset);
    vertexAttributes.push(
        { name: 'a_normal', type: 'float3', offset: vertexDataOffset, stride: normalStride },
    );
    vertexDataOffset += normalData.byteLength;

    if (colorData) {
        result.updateVertexData(colorData, vertexDataOffset);
        const attrType = colorType as ATTRIBUTE_TYPE;
        const isNormalized = colorType !== 'float3' && colorType !== 'float4';
        vertexAttributes.push(
            {
                name: 'a_color', type: attrType, normalized: isNormalized,
                offset: vertexDataOffset, stride: colorStride,
            },
        );
        vertexDataOffset += colorData.byteLength;
    }

    if (texcoordData) {
        result.updateVertexData(texcoordData, vertexDataOffset);
        const attrType = texcoordType as ATTRIBUTE_TYPE;
        const isNormalized = texcoordType !== 'float2';
        vertexAttributes.push(
            {
                name: 'a_texcoord', type: attrType, normalized: isNormalized,
                offset: vertexDataOffset, stride: texcoordStride,
            },
        );
        vertexDataOffset += texcoordData.byteLength;
    }

    const schema = parseVertexSchema(vertexAttributes);
    result.setVertexSchema(schema);

    result.allocateIndexBuffer(indicesData.byteLength);
    result.updateIndexData(indicesData);
    result.setIndexConfig({
        indexCount: indicesCount,
        indexType: INDEX_TYPE_TO_TYPE[indicesType as GLTF_INDEX_TYPE],
        primitiveMode: 'triangles',
    });

    const material = getMaterialInfo(asset, primitive);

    // TODO: Share program between all primitives (some schema check should be updated?).
    const programDefinitions = {
        HAS_COLOR_ATTR: colorData ? '1' : '0',
        HAS_TEXCOORD_ATTR: texcoordData ? '1' : '0',
        HAS_MATERIAL: material ? '1' : '0',
        HAS_BASE_COLOR_TEXTURE: !!texcoordData
            && material?.baseColorTextureIndex !== undefined ? '1' : '0',
        HAS_METALLIC_ROUGHNESS_TEXTURE: !!texcoordData
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

function getAccessor(idx: number, asset: GlTFAsset): GlTFSchema.Accessor {
    const accessor = asset.gltf.accessors?.[idx];
    if (!accessor) {
        throw new Error(`no ${idx} accessor`);
    }
    return accessor;
}

function generateIndices(count: number): Uint8Array {
    const arr = new Uint16Array(count);
    for (let i = 0; i < arr.length; ++i) {
        arr[i] = i;
    }
    return new Uint8Array(arr.buffer);
}

type GLTF_INDEX_TYPE = Extract<GlTF_ACCESSOR_TYPE, 'ubyte1' | 'ushort1' | 'uint1'>;

const INDEX_TYPE_TO_TYPE: Readonly<Record<GLTF_INDEX_TYPE, INDEX_TYPE>> = {
    'ubyte1': 'u8',
    'ushort1': 'u16',
    'uint1': 'u32',
};
