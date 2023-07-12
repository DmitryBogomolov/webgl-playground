import type { GlTF_ACCESSOR_TYPE } from '../../gltf/accessor.types';
import type { Vec3, Vec3Mut } from '../../geometry/vec3.types';
import { vec3, sub3, cross3, norm3 } from '../../geometry/vec3';

type GLTF_INDEX_TYPE = Extract<GlTF_ACCESSOR_TYPE, 'ubyte1' | 'ushort1' | 'uint1'>;
type IndexViewCtor = Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor;

const INDEX_TYPE_TO_VIEW: Readonly<Record<GLTF_INDEX_TYPE, IndexViewCtor>> = {
    'ubyte1': Uint8Array,
    'ushort1': Uint16Array,
    'uint1': Uint32Array,
};

export function generateNormals(
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
