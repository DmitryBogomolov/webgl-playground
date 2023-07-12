import type { GlTFAsset, GlTFSchema } from '../../gltf/asset.types';
import type { Mat4, Mat4Mut } from '../../geometry/mat4.types';
import type { Runtime } from '../../gl/runtime';
import type { PrimitiveWrapper } from './primitive';
import type { DisposableContextProxy } from '../../utils/disposable-context.types';
import { identity4x4, mul4x4 } from '../../geometry/mat4';
import { getNodeTransform } from '../../gltf/node';
import { createPrimitive } from './primitive';

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#concepts
export function processScene(
    asset: GlTFAsset, runtime: Runtime, context: DisposableContextProxy,
): PrimitiveWrapper[] {
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
    asset: GlTFAsset, runtime: Runtime, context: DisposableContextProxy,
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
