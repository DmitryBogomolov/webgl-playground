import type { GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData } from './gltf-renderer.types';
import type {
    GlTF_ACCESSOR_TYPE, GlTFAsset, GlTF_PRIMITIVE_MODE, GlTFSchema, GlTFResolveUriFunc, GlTFMaterial,
} from '../../gltf/gltf.types';
import type { Logger } from '../../common/logger.types';
import type { Vec3, Vec3Mut } from '../../geometry/vec3.types';
import type { Mat4, Mat4Mut } from '../../geometry/mat4.types';
import type { AttributeOptions, ATTRIBUTE_TYPE } from '../../gl/vertex-schema.types';
import type { INDEX_TYPE } from '../../gl/primitive.types';
import type { Runtime } from '../../gl/runtime';
import { BaseDisposable } from '../../common/base-disposable';
import { Primitive } from '../../gl/primitive';
import { Program } from '../../gl/program';
import { parseVertexSchema } from '../../gl/vertex-schema';
import { vec3, clone3, sub3, cross3, norm3 } from '../../geometry/vec3';
import { mat4, identity4x4, clone4x4, mul4x4, inverse4x4 } from '../../geometry/mat4';
import {
    parseGlTF, getNodeTransform, getAccessorType, getPrimitiveMode,
    getBufferSlice, getAccessorStride, getPrimitiveMaterial,
} from '../../gltf/gltf';
import vertShader from './shader.vert';
import fragShader from './shader.frag';

function isRawData(data: GlTFRendererData): data is GlTFRendererRawData {
    return data && ArrayBuffer.isView((data as GlTFRendererRawData).data);
}

function isUrlData(data: GlTFRendererData): data is GlTFRendererUrlData {
    return data && typeof (data as GlTFRendererUrlData).url === 'string';
}

interface PrimitiveWrapper {
    readonly primitive: Primitive;
    readonly matrix: Mat4;
    readonly material: GlTFMaterial | null;
}

export class GlbRenderer extends BaseDisposable {
    private readonly _runtime: Runtime;
    private readonly _wrappers: PrimitiveWrapper[];
    private _projMat: Mat4 = identity4x4();
    private _viewMat: Mat4 = identity4x4();
    private _eyePosition: Vec3 = vec3(0, 0, 0);
    private _lightDirection: Vec3 = vec3(0, 0, -1);

    constructor(runtime: Runtime, tag?: string) {
        super(runtime.logger(), tag);
        this._runtime = runtime;
        this._wrappers = [];
    }

    dispose(): void {
        for (const wrapper of this._wrappers) {
            wrapper.primitive.dispose();
        }
        this._dispose();
    }

    async setData(data: GlTFRendererData): Promise<void> {
        if (!data) {
            throw this._logger.error('set_data: null');
        }
        let source: ArrayBufferView;
        let resolveUri: GlTFResolveUriFunc;
        if (isRawData(data)) {
            source = data.data;
            // eslint-disable-next-line @typescript-eslint/require-await
            resolveUri = async (uri) => {
                const content = data.additionalData?.[uri];
                if (content) {
                    return content;
                }
                throw new Error(`${uri} is not provided`);
            };
        } else if (isUrlData(data)) {
            source = await load(data.url);
            const baseUrl = data.url.substring(0, data.url.lastIndexOf('/') + 1);
            resolveUri = async (uri) => {
                return load(baseUrl + uri);
            };
        } else {
            throw this._logger.error('set_data({0}): bad value', data);
        }
        const asset = await parseGlTF(source, resolveUri);
        this._setup(asset);
    }

    private _setup(asset: GlTFAsset): void {
        // TODO: Remove existing wrappers (if any).
        const wrappers = processScene(asset, this._runtime, this._logger);
        this._wrappers.push(...wrappers);
    }

    setProjMat(mat: Mat4): void {
        this._projMat = clone4x4(mat);
    }

    setViewMat(mat: Mat4): void {
        this._viewMat = clone4x4(mat);
        const invViewMat = inverse4x4(this._viewMat, _m4_scratch as Mat4Mut);
        this._eyePosition = vec3(invViewMat[12], invViewMat[13], invViewMat[14]);
    }

    setLightDirection(lightDirection: Vec3): void {
        this._lightDirection = clone3(lightDirection);
    }

    render(): void {
        for (const wrapper of this._wrappers) {
            this._renderPrimitive(wrapper);
        }
    }

    private _renderPrimitive(wrapper: PrimitiveWrapper): void {
        const program = wrapper.primitive.program();
        program.setUniform('u_proj_mat', this._projMat);
        program.setUniform('u_view_mat', this._viewMat);
        program.setUniform('u_world_mat', wrapper.matrix);
        if (wrapper.material) {
            program.setUniform('u_eye_position', this._eyePosition);
            program.setUniform('u_light_direction', this._lightDirection);
            program.setUniform('u_material_base_color', wrapper.material.baseColorFactor);
            program.setUniform('u_material_roughness', wrapper.material.roughnessFactor);
            program.setUniform('u_material_metallic', wrapper.material.metallicFactor);
        }
        wrapper.primitive.render();
    }
}

const _m4_scratch = mat4();

async function load(url: string): Promise<ArrayBufferView> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#concepts
function processScene(asset: GlTFAsset, runtime: Runtime, logger: Logger): PrimitiveWrapper[] {
    const { scenes, scene: sceneIdx } = asset.gltf;
    const scene = scenes && sceneIdx !== undefined && scenes[sceneIdx];
    // Though specification allows to have no scene there is no sense in accepting such assets.
    if (!scene) {
        throw logger.error('no scene');
    }
    if (!scene.nodes) {
        throw logger.error('no scene nodes');
    }
    const wrappers: PrimitiveWrapper[] = [];
    traverseNodes(scene.nodes[0], identity4x4(), wrappers, asset, runtime, logger);
    return wrappers;
}

function traverseNodes(
    nodeIdx: number, parentTransform: Mat4,
    wrappers: PrimitiveWrapper[], asset: GlTFAsset, runtime: Runtime, logger: Logger,
): void {
    const node = getNode(nodeIdx, asset, logger);
    const nodeTransform = getNodeTransform(node) || identity4x4();
    mul4x4(parentTransform, nodeTransform, nodeTransform as Mat4Mut);
    if (node.mesh !== undefined) {
        const mesh = getMesh(node.mesh, asset, logger);
        for (const desc of mesh.primitives) {
            const wrapper = createPrimitive(desc, nodeTransform, asset, runtime, logger);
            wrappers.push(wrapper);
        }
    }
    if (node.children) {
        for (const idx of node.children) {
            traverseNodes(idx, nodeTransform, wrappers, asset, runtime, logger);
        }
    }
}

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

function createPrimitive(
    primitive: GlTFSchema.MeshPrimitive, transform: Mat4,
    asset: GlTFAsset, runtime: Runtime, logger: Logger,
): PrimitiveWrapper {
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
    const positionStride = getAccessorStride(asset, positionAccessor);

    let indicesType: GlTF_ACCESSOR_TYPE;
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
        indicesType = 'ushort1';
        indicesCount = positionAccessor.count;
        indicesData = generateIndices(positionAccessor.count);
    }

    let normalData: Uint8Array;
    let normalStride: number;
    if (normalIdx !== undefined) {
        const normalAccessor = getAccessor(normalIdx, asset, logger);
        if (getAccessorType(normalAccessor) !== VALID_NORMAL_TYPE) {
            throw logger.error('bad NORMAL type: {0}', getAccessorType(normalAccessor));
        }
        if (normalAccessor.count !== positionAccessor.count) {
            throw logger.error('bad NORMAL count: {0}', normalAccessor.count);
        }
        normalData = getBufferSlice(asset, normalAccessor);
        normalStride = getAccessorStride(asset, normalAccessor);
    } else {
        normalData = generateNormals(positionData, indicesData, indicesType);
        normalStride = 12;
    }

    let colorType: GlTF_ACCESSOR_TYPE | undefined;
    let colorData: Uint8Array | undefined;
    let colorStride: number | undefined;
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
        colorStride = getAccessorStride(asset, colorAccessor);
    }

    let texcoordType: GlTF_ACCESSOR_TYPE | undefined;
    let texcoordData: Uint8Array | undefined;
    let texcoordStride: number | undefined;
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
        texcoordStride = getAccessorStride(asset, texcoordAccessor);
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

    const material = getPrimitiveMaterial(asset, primitive);

    // TODO: Share program between all primitives (some schema check should be updated?).
    const program = new Program(runtime, {
        schema,
        vertShader: makeShaderSource(vertShader, !!colorData, !!texcoordData, !!material),
        fragShader: makeShaderSource(fragShader, !!colorData, !!texcoordData, !!material),
    });
    result.setProgram(program);

    return {
        primitive: result,
        matrix: transform,
        material,
    };
}

function generateIndices(count: number): Uint8Array {
    const arr = new Uint16Array(count);
    for (let i = 0; i < arr.length; ++i) {
        arr[i] = i;
    }
    return new Uint8Array(arr.buffer);
}

type GLTF_INDEX_TYPE = Extract<GlTF_ACCESSOR_TYPE, 'ubyte1' | 'ushort1' | 'uint1'>;
type IndexViewCtor = Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor;

const INDEX_TYPE_TO_VIEW: Readonly<Record<GLTF_INDEX_TYPE, IndexViewCtor>> = {
    'ubyte1': Uint8Array,
    'ushort1': Uint16Array,
    'uint1': Uint32Array,
};

const INDEX_TYPE_TO_TYPE: Readonly<Record<GLTF_INDEX_TYPE, INDEX_TYPE>> = {
    'ubyte1': 'u8',
    'ushort1': 'u16',
    'uint1': 'u32',
};

function generateNormals(
    positionData: Uint8Array, indicesData: Uint8Array, indicesType: GlTF_ACCESSOR_TYPE,
): Uint8Array {
    const positions = new Float32Array(
        positionData.buffer, positionData.byteOffset, positionData.byteLength >> 2,
    );
    const normals = new Float32Array(positions.length);
    const indicesCtor = INDEX_TYPE_TO_VIEW[indicesType as GLTF_INDEX_TYPE];
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
        updateVec3(p1, positions, i1);
        updateVec3(p2, positions, i2);
        updateVec3(p3, positions, i3);
        sub3(p2, p1, dir1);
        sub3(p3, p1, dir2);
        cross3(dir1, dir2, norm);
        norm3(norm, norm);
        updateArr(normals, i1, norm);
        updateArr(normals, i2, norm);
        updateArr(normals, i3, norm);
    }
    return new Uint8Array(normals.buffer);
}

function updateVec3(v: Vec3Mut, arr: { readonly [i: number]: number }, idx: number): void {
    const k = 3 * idx;
    v.x = arr[k + 0];
    v.y = arr[k + 1];
    v.z = arr[k + 2];
}

function updateArr(arr: { [i: number]: number }, idx: number, v: Vec3): void {
    const k = 3 * idx;
    arr[k + 0] = v.x;
    arr[k + 1] = v.y;
    arr[k + 2] = v.z;
}

function getNode(idx: number, asset: GlTFAsset, logger: Logger): GlTFSchema.Node {
    const node = asset.gltf.nodes?.[idx];
    if (!node) {
        throw logger.error('no {0} node', idx);
    }
    return node;
}

function getMesh(idx: number, asset: GlTFAsset, logger: Logger): GlTFSchema.Mesh {
    const mesh = asset.gltf.meshes?.[idx];
    if (!mesh) {
        throw logger.error('no {0} mesh', idx);
    }
    return mesh;
}

function getAccessor(idx: number, asset: GlTFAsset, logger: Logger): GlTFSchema.Accessor {
    const accessor = asset.gltf.accessors?.[idx];
    if (!accessor) {
        throw logger.error('no {0} accessor', idx);
    }
    return accessor;
}

function makeShaderSource(
    source: string, hasColor: boolean, hasTexcoord: boolean, hasMaterial: boolean,
): string {
    const lines = [
        `#define HAS_COLOR_ATTR ${Number(hasColor)}`,
        `#define HAS_TEXCOORD_ATTR ${Number(hasTexcoord)}`,
        `#define HAS_MATERIAL ${Number(hasMaterial)}`,
        '',
        '#line 1 0',
        source,
    ];
    return lines.join('\n');
}
