import type { GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData } from './gltf-renderer.types';
import type { GlTFAccessorType, GlTFAsset, GlTFPrimitiveMode, GlTFSchema } from '../alg/gltf.types';
import type { Logger } from '../utils/logger.types';
import type { Vec3Mut } from '../geometry/vec3.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import type { AttributeOptions, ATTRIBUTE_TYPE } from '../gl/vertex-schema.types';
import type { Runtime } from '../gl/runtime';
import { BaseWrapper } from '../gl/base-wrapper';
import { Primitive } from '../gl/primitive';
import { Program } from '../gl/program';
import { parseVertexSchema } from '../gl/vertex-schema';
import { vec3, sub3, cross3, norm3 } from '../geometry/vec3';
import { identity4x4, mul4x4 } from '../geometry/mat4';
import { parseGlTF, getNodeTransform, getAccessorType, getPrimitiveMode, getBufferSlice } from '../alg/gltf';
import vertShaderSource from './gltf-renderer-shader.vert';
import fragShaderSource from './gltf-renderer-shader.frag';

function isRawData(data: GlTFRendererData): data is GlTFRendererRawData {
    return data && ArrayBuffer.isView((data as GlTFRendererRawData).data);
}

function isUrlData(data: GlTFRendererData): data is GlTFRendererUrlData {
    return data && typeof (data as GlTFRendererUrlData).url === 'string';
}

export class GlbRenderer extends BaseWrapper {
    private readonly _runtime: Runtime;
    private readonly _primitives: Primitive[];

    constructor(runtime: Runtime, tag?: string) {
        super(runtime.logger(), tag);
        this._runtime = runtime;
        this._primitives = [];
    }

    dispose(): void {
        for (const primitive of this._primitives) {
            primitive.dispose();
        }
    }

    async setData(data: GlTFRendererData): Promise<void> {
        if (!data) {
            throw this._logger.error('set_data: null');
        }
        let source: ArrayBufferView;
        if (isRawData(data)) {
            source = data.data;
        } else if (isUrlData(data)) {
            source = await load(data.url);
        } else {
            throw this._logger.error('set_data({0}): bad value', data);
        }
        const asset = parseGlTF(source);
        this._setup(asset);
    }

    private _setup(asset: GlTFAsset): void {
        const primitives = processScene(asset, this._runtime, this._logger);
        this._primitives.push(...primitives);
    }

    render(): void {
        // TODO...
    }
}

async function load(url: string): Promise<ArrayBufferView> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#concepts
function processScene(asset: GlTFAsset, runtime: Runtime, logger: Logger): Primitive[] {
    const { scenes, scene: sceneIdx, nodes } = asset.desc;
    const scene = scenes && sceneIdx !== undefined && scenes[sceneIdx];
    // Though specification allows to have no scene there is no sense in accepting such assets.
    if (!scene) {
        throw logger.error('no scene');
    }
    if (!scene.nodes) {
        throw logger.error('no scene nodes');
    }
    const primitives: Primitive[] = [];
    traverseNodes(scene.nodes[0], identity4x4(), primitives, asset, runtime, logger);
    return primitives;
}

function traverseNodes(nodeIdx: number, parentTransform: Mat4, primitives: Primitive[], asset: GlTFAsset, runtime: Runtime, logger: Logger): void {
    const node = asset.desc.nodes?.[nodeIdx];
    if (!node) {
        throw logger.error('no {0} node', nodeIdx);
    }
    const nodeTransform = getNodeTransform(node) || identity4x4();
    mul4x4(parentTransform, nodeTransform, nodeTransform as Mat4Mut);
    if (node.mesh !== undefined) {
        const mesh = getMesh(node.mesh, asset, logger);
        for (const desc of mesh.primitives) {
            const primitive = createPrimitive(desc, nodeTransform, asset, runtime, logger);
            primitives.push(primitive);
        }
    }
    if (node.children) {
        for (const idx of node.children) {
            traverseNodes(idx, nodeTransform, primitives, asset, runtime, logger);
        }
    }
}

const SUPPORTED_PRIMITIVE_MODE: GlTFPrimitiveMode = 'triangles';
const VALID_INDEX_TYPES: ReadonlySet<GlTFAccessorType> = new Set<GlTFAccessorType>(
    ['ubyte', 'ushort', 'uint'],
);
const VALID_POSITION_TYPE: GlTFAccessorType = 'float3';
const VALID_NORMAL_TYPE: GlTFAccessorType = 'float3';
const VALID_COLOR_TYPES: ReadonlySet<GlTFAccessorType> = new Set<GlTFAccessorType>(
    ['float3', 'float4', 'ubyte3', 'ubyte4', 'ushort3', 'ushort4'],
);
const VALID_TEXCOORD_TYPE: ReadonlySet<GlTFAccessorType> = new Set<GlTFAccessorType>(
    ['float2', 'ubyte2', 'ushort2'],
);

function createPrimitive(primitive: GlTFSchema.MeshPrimitive, transform: Mat4, asset: GlTFAsset, runtime: Runtime, logger: Logger): Primitive {
    const {
        POSITION: positionIdx,
        NORMAL: normalIdx,
        COLOR_0: colorIdx,
        TEXCOORD_0: texcoordIdx,
    } = primitive.attributes;
    // For now let's support only triangles.
    if (getPrimitiveMode(primitive) !== SUPPORTED_PRIMITIVE_MODE) {
        throw logger.error('not supported primitive mode: {0}', getPrimitiveMode(primitive));
    }

    // Though specification allows to have no positions there is no sense in accepting such primitives.
    if (positionIdx === undefined) {
        throw logger.error('no POSITION attribute');
    }
    const positionAccessor = getAccessor(positionIdx, asset, logger);
    if (getAccessorType(positionAccessor) !== VALID_POSITION_TYPE) {
        throw logger.error('bad POSITION type: {0}', getAccessorType(positionAccessor));
    }
    const positionData = getBufferSlice(asset, positionAccessor);

    let indicesType: GlTFAccessorType;
    let indicesCount: number;
    let indicesData: Uint8Array;
    if (primitive.indices !== undefined) {
        const indicesAccessor = getAccessor(primitive.indices, asset, logger);
        indicesType = getAccessorType(indicesAccessor);
        if (!VALID_INDEX_TYPES.has(indicesType)) {
            throw logger.error('bad index type: {0}', indicesType);
        }
        indicesCount = indicesAccessor.count;
        indicesData = getBufferSlice(asset, indicesAccessor);
    } else {
        indicesType = 'ushort';
        indicesCount = positionAccessor.count;
        indicesData = generateIndices(positionAccessor.count);
    }

    let normalData: Uint8Array;
    if (normalIdx !== undefined) {
        const normalAccessor = getAccessor(normalIdx, asset, logger);
        if (getAccessorType(normalAccessor) !== VALID_NORMAL_TYPE) {
            throw logger.error('bad NORMAL type: {0}', getAccessorType(normalAccessor));
        }
        if (normalAccessor.count !== positionAccessor.count) {
            throw logger.error('bad NORMAL count: {0}', normalAccessor.count);
        }
        normalData = getBufferSlice(asset, normalAccessor);
    } else {
        normalData = generateNormals(positionData, indicesData, indicesType);
    }

    let colorType: GlTFAccessorType | undefined;
    let colorData: Uint8Array | undefined;
    if (colorIdx !== undefined) {
        const colorAccessor = getAccessor(colorIdx, asset, logger);
        colorType = getAccessorType(colorAccessor);
        if (!VALID_COLOR_TYPES.has(colorType)) {
            throw logger.error('bad COLOR_0 type: {0}', colorType);
        }
        if (colorAccessor.count !== positionAccessor.count) {
            throw logger.error('bad COLOR_0 count: {0}', colorAccessor.count);
        }
        colorData = getBufferSlice(asset, colorAccessor);
    }

    let texcoordType: GlTFAccessorType | undefined;
    let texcoordData: Uint8Array | undefined;
    if (texcoordIdx !== undefined) {
        const texcoordAccessor = getAccessor(texcoordIdx, asset, logger);
        texcoordType = getAccessorType(texcoordAccessor);
        if (!VALID_TEXCOORD_TYPE.has(texcoordType)) {
            throw logger.error('bad TEXCOORD_0 type: {0}', texcoordType);
        }
        if (texcoordAccessor.count !== positionAccessor.count) {
            throw logger.error('bad TEXCOORD_0 count: {0}', texcoordAccessor.count);
        }
        texcoordData = getBufferSlice(asset, texcoordAccessor);
    }

    let totalVertexDataSize = positionData.byteLength + normalData.byteLength;
    if (colorData) {
        totalVertexDataSize += colorData.byteLength;
    }
    if (texcoordData) {
        totalVertexDataSize += texcoordData.byteLength;
    }

    const result = new Primitive(runtime);

    result.allocateVertexBuffer(totalVertexDataSize);
    const vertexAttributes: AttributeOptions[] = [];
    let vertexDataOffset = 0;

    result.updateVertexData(positionData, vertexDataOffset);
    vertexAttributes.push({ name: 'a_position', type: 'float3', offset: vertexDataOffset });
    vertexDataOffset += positionData.byteLength;

    result.updateVertexData(normalData, vertexDataOffset);
    vertexAttributes.push({ name: 'a_normal', type: 'float3', offset: vertexDataOffset });
    vertexDataOffset += normalData.byteLength;

    if (colorData && colorType) {
        result.updateVertexData(colorData, vertexDataOffset);
        const attrType = colorType as ATTRIBUTE_TYPE;
        const isNormalized = colorType !== 'float3' && colorType !== 'float4';
        vertexAttributes.push(
            { name: 'a_color', type: attrType, normalized: isNormalized, offset: vertexDataOffset },
        );
        vertexDataOffset += colorData.byteLength;
    }

    if (texcoordData && texcoordType) {
        result.updateVertexData(texcoordData, vertexDataOffset);
        const attrType = texcoordType as ATTRIBUTE_TYPE;
        const isNormalized = texcoordType !== 'float2';
        vertexAttributes.push(
            { name: 'a_texcoord', type: attrType, normalized: isNormalized, offset: vertexDataOffset },
        );
        vertexDataOffset += texcoordData.byteLength;
    }

    const schema = parseVertexSchema(vertexAttributes);
    result.setVertexSchema(schema);

    result.allocateIndexBuffer(indicesData.byteLength);
    result.updateIndexData(indicesData);
    result.setIndexConfig({
        indexCount: indicesCount,
        indexType: INDEX_TYPE_TO_TYPE[indicesType as keyof typeof INDEX_TYPE_TO_TYPE],
        primitiveMode: 'triangles',
    });

    // TODO: Share program between all primitives (some schema check should be updated?).
    const program = new Program(runtime, {
        schema,
        vertShader: vertShaderSource,
        fragShader: fragShaderSource,
    });
    result.setProgram(program);

    return result;
}

function generateIndices(count: number): Uint8Array {
    const arr = new Uint16Array(count);
    for (let i = 0; i < arr.length; ++i) {
        arr[i] = i;
    }
    return new Uint8Array(arr.buffer);
}

const INDEX_TYPE_TO_VIEW = {
    'ubyte': Uint8Array,
    'ushort': Uint16Array,
    'uint': Uint32Array,
} as const;

const INDEX_TYPE_TO_TYPE = {
    'ubyte': 'u8',
    'ushort': 'u16',
    'uint': 'u32',
} as const;

function generateNormals(
    positionData: Uint8Array, indicesData: Uint8Array, indicesType: GlTFAccessorType,
): Uint8Array {
    const positions = new Float32Array(
        positionData.buffer, positionData.byteOffset, positionData.byteLength >> 2,
    );
    const normals = new Float32Array(positions.length);
    const indicesCtor = INDEX_TYPE_TO_VIEW[indicesType as keyof typeof INDEX_TYPE_TO_VIEW];
    const indices = new indicesCtor(
        indicesData.buffer, indicesData.byteOffset, indicesData.byteLength / indicesCtor.BYTES_PER_ELEMENT,
    );

    const p1 = vec3(0, 0, 0) as Vec3Mut;
    const p2 = vec3(0, 0, 0) as Vec3Mut;
    const p3 = vec3(0, 0, 0) as Vec3Mut;
    const dir1 = vec3(0, 0, 0) as Vec3Mut;
    const dir2 = vec3(0, 0, 0) as Vec3Mut;
    const norm = vec3(0, 0, 0) as Vec3Mut;
    // Assuming 'triangles' mode.
    for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i + 0];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];
        p1.x = positions[3 * i1 + 0]; p1.y = positions[3 * i1 + 1]; p1.z = positions[3 * i1 + 2];
        p2.x = positions[3 * i2 + 0]; p2.y = positions[3 * i2 + 1]; p2.z = positions[3 * i2 + 2];
        p3.x = positions[3 * i3 + 0]; p3.y = positions[3 * i3 + 1]; p3.z = positions[3 * i3 + 2];
        sub3(p2, p1, dir1);
        sub3(p3, p1, dir2);
        cross3(dir1, dir2, norm);
        norm3(norm, norm);
        normals[3 * i1 + 0] = norm.x; normals[3 * i1 + 1] = norm.y; normals[3 * i1 + 2] = norm.z;
        normals[3 * i2 + 0] = norm.x; normals[3 * i2 + 1] = norm.y; normals[3 * i2 + 2] = norm.z;
        normals[3 * i3 + 0] = norm.x; normals[3 * i3 + 1] = norm.y; normals[3 * i3 + 2] = norm.z;
    }
    return new Uint8Array(normals.buffer);
}

function getMesh(idx: number, asset: GlTFAsset, logger: Logger): GlTFSchema.Mesh {
    const mesh = asset.desc.meshes?.[idx];
    if (!mesh) {
        throw logger.error('no {0} mesh', idx);
    }
    return mesh;
}

function getAccessor(idx: number, asset: GlTFAsset, logger: Logger): GlTFSchema.Accessor {
    const accessor = asset.desc.accessors?.[idx];
    if (!accessor) {
        throw logger.error('no {0} accessor', idx);
    }
    return accessor;
}
