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
const VALID_POSITION_TYPES: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
    ['float3'],
);
const VALID_NORMAL_TYPES: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
    ['float3'],
);
const VALID_COLOR_TYPES: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
    ['float3', 'float4', 'ubyte3', 'ubyte4', 'ushort3', 'ushort4'],
);
const VALID_TEXCOORD_TYPES: ReadonlySet<GlTF_ACCESSOR_TYPE> = new Set<GlTF_ACCESSOR_TYPE>(
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

    const result = new Primitive(runtime);
    context.add(result);

    const totalVertexDataSize = calculateTotalSize([positionInfo, normalInfo, colorInfo, texcoordInfo]);
    result.allocateVertexBuffer(totalVertexDataSize);
    const vertexAttributes: AttributeOptions[] = [];
    let vertexDataOffset = 0;

    vertexDataOffset = setVertexData(
        positionInfo, result, vertexAttributes, 'a_position', vertexDataOffset, undefined,
    );
    vertexDataOffset = setVertexData(
        normalInfo, result, vertexAttributes, 'a_normal', vertexDataOffset, undefined,
    );
    if (colorInfo) {
        const normalized = colorInfo.type !== 'float3' && colorInfo.type !== 'float4';
        vertexDataOffset = setVertexData(
            colorInfo, result, vertexAttributes, 'a_color', vertexDataOffset, normalized,
        );
    }
    if (texcoordInfo) {
        const normalized = texcoordInfo.type !== 'float2';
        vertexDataOffset = setVertexData(
            texcoordInfo, result, vertexAttributes, 'a_texcoord', vertexDataOffset, normalized,
        );
    }
    if (vertexDataOffset !== totalVertexDataSize) {
        throw new Error('data offset mismatch');
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

function calculateTotalSize(attributes: Iterable<AttributeInfo | null>): number {
    let result = 0;
    for (const attr of attributes) {
        if (attr) {
            result += attr.data.byteLength;
        }
    }
    return result;
}

function setVertexData(
    info: AttributeInfo, primitive: Primitive, attributes: AttributeOptions[],
    name: string, offset: number, normalized: boolean | undefined,
): number {
    primitive.updateVertexData(info.data, offset);
    attributes.push({
        name,
        type: info.type as ATTRIBUTE_TYPE,
        offset: offset,
        stride: info.stride,
        normalized,
    });
    return offset + info.data.byteLength;
}

function noop(): void {
    // Nothing.
}

function makeAccessorTypeValidator(
    validTypes: ReadonlySet<GlTF_ACCESSOR_TYPE>, name: string,
): (type: GlTF_ACCESSOR_TYPE) => void {
    return (type) => {
        if (!validTypes.has(type)) {
            throw new Error(`bad ${name} type: ${type}`);
        }
    };
}

function makeAccessorCountValidator(
    matchCount: number, name: string,
): (count: number) => void {
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
