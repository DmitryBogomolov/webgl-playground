import type { GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData } from './gltf-renderer.types';
import type { GlTFAsset, GlTFSchema } from '../alg/gltf.types';
import type { Logger } from '../utils/logger.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import type { Runtime } from '../gl/runtime';
import { BaseWrapper } from '../gl/base-wrapper';
import { Primitive } from '../gl/primitive';
import { parseGlTF } from '../alg/gltf';
import { vec3 } from '../geometry/vec3';
import { identity4x4, mul4x4, update4x4, apply4x4, scaling4x4, translation4x4 } from '../geometry/mat4';

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
    const scene = scenes && sceneIdx && scenes[sceneIdx];
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
    const nodeTransform = getNodeTransform(node);
    const currentTransform = nodeTransform
        ? mul4x4(parentTransform, nodeTransform, nodeTransform as Mat4Mut) : parentTransform;
    if (node.mesh) {
        const mesh = asset.desc.meshes?.[node.mesh];
        if (!mesh) {
            throw logger.error('no {0} mesh', node.mesh);
        }
        for (const desc of mesh.primitives) {
            const primitive = createPrimitive(desc, currentTransform, asset, runtime, logger);
            primitives.push(primitive);
        }
    }
    if (node.children) {
        for (const idx of node.children) {
            traverseNodes(idx, currentTransform, primitives, asset, runtime, logger);
        }
    }
}

function createPrimitive(desc: GlTFSchema.MeshPrimitive, transform: Mat4, asset: GlTFAsset, runtime: Runtime, logger: Logger): Primitive {
    const primitive = new Primitive(runtime);
    return primitive;
}

function getNodeTransform(node: GlTFSchema.Node): Mat4 | null {
    if (node.scale || node.rotation || node.translation) {
        const transform = identity4x4() as Mat4Mut;
        if (node.scale) {
            const scale = vec3(node.scale[0], node.scale[1], node.scale[2]);
            apply4x4(transform, scaling4x4, scale);
        }
        if (node.rotation) {
            // TODO: Support quaternions.
        }
        if (node.translation) {
            const translate = vec3(node.translation[0], node.translation[1], node.translation[2]);
            apply4x4(transform, translation4x4, translate);
        }
        return transform;
    }
    if (node.matrix) {
        return update4x4(node.matrix);
    }
    return null;
}
