import type { GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData } from './gltf-renderer.types';
import type { GlTFAsset, GlTFSchema } from '../alg/gltf.types';
import type { Logger } from '../utils/logger.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import type { Runtime } from '../gl/runtime';
import { BaseWrapper } from '../gl/base-wrapper';
import { Primitive } from '../gl/primitive';
import { parseGlTF, getNodeTransform } from '../alg/gltf';
import { identity4x4, mul4x4 } from '../geometry/mat4';

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
    if (!scene) {
        logger.warn('no scene');
        return [];
    }
    if (!scene.nodes) {
        logger.warn('no scene nodes');
        return [];
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
            if (primitive) {
                primitives.push(primitive);
            }
        }
    }
    if (node.children) {
        for (const idx of node.children) {
            traverseNodes(idx, nodeTransform, primitives, asset, runtime, logger);
        }
    }
}

function createPrimitive(desc: GlTFSchema.MeshPrimitive, transform: Mat4, asset: GlTFAsset, runtime: Runtime, logger: Logger): Primitive | null {
    const attrs = desc.attributes;
    const positionIdx = attrs.POSITION;
    if (positionIdx === undefined) {
        logger.warn('no POSITION for primitive');
        return null;
    }
    const positionAccessor = getAccessor(positionIdx, asset, logger);
    const normalIdx = attrs.NORMAL;
    if (normalIdx === undefined) {

    }

    const primitive = new Primitive(runtime);
    return primitive;
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
