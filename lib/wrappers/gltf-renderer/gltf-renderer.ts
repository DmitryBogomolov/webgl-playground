import type { GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData } from './gltf-renderer.types';
import type { GlTFAsset, GlTFSchema } from '../../gltf/asset.types';
import type { GlTFResolveUriFunc } from '../../gltf/parse.types';
import type { GlTF_ACCESSOR_TYPE } from '../../gltf/accessor.types';
import type { GlTF_PRIMITIVE_MODE } from '../../gltf/primitive.types';
import type { GlTFMaterial } from '../../gltf/material.types';
import type { GlTFTexture } from '../../gltf/texture.types';
import type { Vec3, Vec3Mut } from '../../geometry/vec3.types';
import type { Mat4, Mat4Mut } from '../../geometry/mat4.types';
import type { AttributeOptions, ATTRIBUTE_TYPE } from '../../gl/vertex-schema.types';
import type { INDEX_TYPE } from '../../gl/primitive.types';
import type { TextureImageDataOptions } from '../../gl/texture-base.types';
import type { Runtime } from '../../gl/runtime';
import { BaseDisposable } from '../../common/base-disposable';
import { Primitive } from '../../gl/primitive';
import { Program } from '../../gl/program';
import { Texture } from '../../gl/texture-2d';
import { parseVertexSchema } from '../../gl/vertex-schema';
import { vec3, sub3, cross3, norm3 } from '../../geometry/vec3';
import { mat4, identity4x4, clone4x4, mul4x4, inverse4x4, inversetranspose4x4 } from '../../geometry/mat4';
import { DisposableContext } from '../../utils/disposable-context';
import { parseGlTF } from '../../gltf/parse';
import { getNodeTransform } from '../../gltf/node';
import { getAccessorType, getAccessorStride, getAccessorBinaryData } from '../../gltf/accessor';
import { getPrimitiveMode } from '../../gltf/primitive';
import { getMaterialInfo } from '../../gltf/material';
import { getTextureInfo } from '../../gltf/texture';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

function isRawData(data: GlTFRendererData): data is GlTFRendererRawData {
    return data && ArrayBuffer.isView((data as GlTFRendererRawData).data);
}

function isUrlData(data: GlTFRendererData): data is GlTFRendererUrlData {
    return data && typeof (data as GlTFRendererUrlData).url === 'string';
}

interface PrimitiveWrapper {
    readonly primitive: Primitive;
    readonly matrix: Mat4;
    readonly normalMatrix: Mat4;
    readonly material: GlTFMaterial | null;
}

export class GlbRenderer extends BaseDisposable {
    private readonly _runtime: Runtime;
    private readonly _wrappers: PrimitiveWrapper[] = [];
    private readonly _textures: Texture[] = [];
    private _projMat: Mat4 = identity4x4();
    private _viewMat: Mat4 = identity4x4();
    private _eyePosition: Vec3 = vec3(0, 0, 0);
    private _lightDirection: Vec3 = norm3(vec3(0, -0.4, -1));

    constructor(runtime: Runtime, tag?: string) {
        super(runtime.logger(), tag);
        this._runtime = runtime;
    }

    dispose(): void {
        this._disposeElements();
        this._dispose();
    }

    private _disposeElements(): void {
        for (const wrapper of this._wrappers) {
            wrapper.primitive.dispose();
            wrapper.primitive.program().dispose();
        }
        for (const texture of this._textures.values()) {
            texture.dispose();
        }
    }

    async setData(data: GlTFRendererData): Promise<void> {
        if (!data) {
            throw this._logger.error('set_data: null');
        }
        let source: ArrayBufferView;
        let resolveUri: GlTFResolveUriFunc;
        if (isRawData(data)) {
            source = data.data;
            resolveUri = (uri) => {
                const content = data.additionalData?.[uri];
                if (content) {
                    return Promise.resolve(content);
                }
                return Promise.reject(new Error(`${uri} is not provided`));
            };
        } else if (isUrlData(data)) {
            source = await load(data.url);
            const baseUrl = data.url.substring(0, data.url.lastIndexOf('/') + 1);
            resolveUri = (uri) => load(baseUrl + uri);
        } else {
            throw this._logger.error('set_data({0}): bad value', data);
        }

        const context = new DisposableContext();
        try {
            const asset = await parseGlTF(source, resolveUri);
            const wrappers = processScene(asset, this._runtime, context);
            const textures = await createTextures(asset, this._runtime, context);
            this._setup(wrappers, textures);
            context.release();
        } catch (err) {
            throw this._logger.error(err as Error);
        } finally {
            context.dispose();
        }
    }

    private _setup(wrappers: ReadonlyArray<PrimitiveWrapper>, textures: ReadonlyArray<Texture>): void {
        this._disposeElements();
        this._wrappers.length = 0;
        this._wrappers.push(...wrappers);
        this._textures.length = 0;
        this._textures.push(...textures);
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
        this._lightDirection = norm3(lightDirection);
    }

    render(): void {
        for (let i = 0; i < this._textures.length; ++i) {
            const texture = this._textures[i];
            this._runtime.setTextureUnit(i, texture);
        }
        for (const wrapper of this._wrappers) {
            this._renderPrimitive(wrapper);
        }
    }

    private _renderPrimitive(wrapper: PrimitiveWrapper): void {
        const program = wrapper.primitive.program();
        program.setUniform('u_proj_mat', this._projMat);
        program.setUniform('u_view_mat', this._viewMat);
        program.setUniform('u_world_mat', wrapper.matrix);
        const { material } = wrapper;
        if (material) {
            program.setUniform('u_normal_mat', wrapper.normalMatrix);
            program.setUniform('u_eye_position', this._eyePosition);
            program.setUniform('u_light_direction', this._lightDirection);
            program.setUniform('u_material_base_color', material.baseColorFactor);
            program.setUniform('u_material_roughness', material.roughnessFactor);
            program.setUniform('u_material_metallic', material.metallicFactor);
            if (material.baseColorTextureIndex !== undefined) {
                program.setUniform('u_base_color_texture', material.baseColorTextureIndex);
            }
            if (material.metallicRoughnessTextureIndex !== undefined) {
                program.setUniform('u_metallic_roughness_texture', material.metallicRoughnessTextureIndex);
            }
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
function processScene(asset: GlTFAsset, runtime: Runtime, context: DisposableContext): PrimitiveWrapper[] {
    const { scenes, scene: sceneIdx } = asset.gltf;
    const scene = scenes && sceneIdx !== undefined && scenes[sceneIdx];
    // Though specification allows to have no scene there is no sense in accepting such assets.
    if (!scene) {
        throw new Error('no scene');
    }
    if (!scene.nodes) {
        throw new Error('no scene nodes');
    }
    const wrappers: PrimitiveWrapper[] = [];
    traverseNodes(scene.nodes[0], identity4x4(), wrappers, asset, runtime, context);
    return wrappers;
}

function traverseNodes(
    nodeIdx: number, parentTransform: Mat4, wrappers: PrimitiveWrapper[],
    asset: GlTFAsset, runtime: Runtime, context: DisposableContext,
): void {
    const node = getNode(nodeIdx, asset);
    const nodeTransform = getNodeTransform(node) || identity4x4();
    mul4x4(parentTransform, nodeTransform, nodeTransform as Mat4Mut);
    if (node.mesh !== undefined) {
        const mesh = getMesh(node.mesh, asset);
        for (const desc of mesh.primitives) {
            const wrapper = createPrimitive(desc, nodeTransform, asset, runtime, context);
            wrappers.push(wrapper);
        }
    }
    if (node.children) {
        for (const idx of node.children) {
            traverseNodes(idx, nodeTransform, wrappers, asset, runtime, context);
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
    if (getAccessorType(positionAccessor) === VALID_POSITION_TYPE) {
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

function getNode(idx: number, asset: GlTFAsset): GlTFSchema.Node {
    const node = asset.gltf.nodes?.[idx];
    if (!node) {
        throw new Error(`no ${idx} node`);
    }
    return node;
}

function getMesh(idx: number, asset: GlTFAsset): GlTFSchema.Mesh {
    const mesh = asset.gltf.meshes?.[idx];
    if (!mesh) {
        throw new Error(`no ${idx} mesh`);
    }
    return mesh;
}

function getAccessor(idx: number, asset: GlTFAsset): GlTFSchema.Accessor {
    const accessor = asset.gltf.accessors?.[idx];
    if (!accessor) {
        throw new Error(`no ${idx} accessor`);
    }
    return accessor;
}

function makeShaderSource(source: string, definitions: Readonly<Record<string, string>>): string {
    const lines: string[] = [];
    for (const [key, val] of Object.entries(definitions)) {
        lines.push(`#define ${key} ${val}`);
    }
    lines.push('', '#line 1 0', source);
    return lines.join('\n');
}

function createTextures(asset: GlTFAsset, runtime: Runtime, context: DisposableContext): Promise<Texture[]> {
    const count = asset.gltf.textures ? asset.gltf.textures.length : 0;
    const tasks: Promise<Texture>[] = [];
    for (let i = 0; i < count; ++i) {
        const textureData = getTextureInfo(asset, i);
        const task = createTexture(textureData, runtime, context);
        tasks.push(task);
    }
    return Promise.all(tasks);
}

const TEXTURE_DATA_OPTIONS: TextureImageDataOptions = {
    unpackFlipY: true,
    unpackColorSpaceConversion: 'none',
    unpackPremultiplyAlpha: false,
};

async function createTexture(
    { data, mimeType, sampler }: GlTFTexture, runtime: Runtime, context: DisposableContext,
): Promise<Texture> {
    const blob = new Blob([data], { type: mimeType });
    const bitmap = await createImageBitmap(blob);
    const texture = new Texture(runtime);
    context.add(texture);
    texture.setParameters({
        wrap_s: sampler.wrapS,
        wrap_t: sampler.wrapT,
        mag_filter: sampler.magFilter,
        min_filter: sampler.minFilter,
    });
    texture.setImageData(bitmap, TEXTURE_DATA_OPTIONS);
    return texture;
}
