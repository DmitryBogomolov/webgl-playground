import type { GlTFSchema } from './asset.types';
import type { Mat4, Mat4Mut } from '../geometry/mat4.types';
import type { Vec4Mut } from '../geometry/vec4.types';
import { vec3 } from '../geometry/vec3';
import { vec4 } from '../geometry/vec4';
import { quat4toAxisAngle } from '../geometry/quat4';
import { identity4x4, update4x4, apply4x4, scaling4x4, rotation4x4, translation4x4 } from '../geometry/mat4';

export function getNodeTransform(node: GlTFSchema.Node): Mat4 | null {
    if (node.scale || node.rotation || node.translation) {
        const transform = identity4x4() as Mat4Mut;
        if (node.scale) {
            const scale = vec3(...node.scale as [number, number, number]);
            apply4x4(transform, scaling4x4, scale);
        }
        if (node.rotation) {
            const rotation = vec4(...node.rotation as [number, number, number, number]);
            quat4toAxisAngle(rotation, rotation as Vec4Mut);
            apply4x4(transform, rotation4x4, rotation, rotation.w);
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
