import type { VertexMaker, VertexIndexData } from './figures.types';
import type { Vec2, Vec2Mut } from '../geometry/vec2.types';
import type { Vec3, Vec3Mut } from '../geometry/vec3.types';
import { vec2, mul2 } from './../geometry/vec2';
import { vec3, mul3, norm3, cross3 } from './../geometry/vec3';

const _v2_scratch = vec2(0, 0);
const _v3_scratch = vec3(0, 0, 0);

export function generatePlaneX<T>(
    size: Vec2, makeVertex: VertexMaker<T>,
): VertexIndexData<T> {
    const { x: dw, y: dh } = mul2(size, 0.5, _v2_scratch as Vec2Mut);
    let idx = 0;
    const vertices = [
        makeVertex({ position: vec3(0, -dw, -dh), normal: vec3(0, 1, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(0, +dw, -dh), normal: vec3(0, 1, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(0, +dw, +dh), normal: vec3(0, 1, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(0, -dw, +dh), normal: vec3(0, 1, 0), texcoord: vec2(0, 1) }, idx++),
    ];
    const indices = [0, 1, 2, 2, 3, 0];
    return { vertices, indices };
}

export function generatePlaneY<T>(
    size: Vec2, makeVertex: VertexMaker<T>,
): VertexIndexData<T> {
    const { x: dw, y: dh } = mul2(size, 0.5, _v2_scratch as Vec2Mut);
    let idx = 0;
    const vertices = [
        makeVertex({ position: vec3(-dh, 0, -dw), normal: vec3(0, 1, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(-dh, 0, +dw), normal: vec3(0, 1, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(+dh, 0, +dw), normal: vec3(0, 1, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(+dh, 0, -dw), normal: vec3(0, 1, 0), texcoord: vec2(0, 1) }, idx++),
    ];
    const indices = [0, 1, 2, 2, 3, 0];
    return { vertices, indices };
}

export function generatePlaneZ<T>(
    size: Vec2, makeVertex: VertexMaker<T>,
): VertexIndexData<T> {
    const { x: dw, y: dh } = mul2(size, 0.5, _v2_scratch as Vec2Mut);
    let idx = 0;
    const vertices = [
        makeVertex({ position: vec3(-dw, -dh, 0), normal: vec3(0, 1, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(+dw, -dh, 0), normal: vec3(0, 1, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(+dw, +dh, 0), normal: vec3(0, 1, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(-dw, +dh, 0), normal: vec3(0, 1, 0), texcoord: vec2(0, 1) }, idx++),
    ];
    const indices = [0, 1, 2, 2, 3, 0];
    return { vertices, indices };
}

export function generateCube<T>(
    size: Vec3, makeVertex: VertexMaker<T>,
): VertexIndexData<T> {
    const { x: dx, y: dy, z: dz } = mul3(size, 0.5, _v3_scratch as Vec3Mut);

    let idx = 0;
    const vertices = [
        // front
        makeVertex({ position: vec3(-dx, -dy, +dz), normal: vec3(0, 0, +1), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(+dx, -dy, +dz), normal: vec3(0, 0, +1), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(+dx, +dy, +dz), normal: vec3(0, 0, +1), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(-dx, +dy, +dz), normal: vec3(0, 0, +1), texcoord: vec2(0, 1) }, idx++),
        // right
        makeVertex({ position: vec3(+dx, -dy, +dz), normal: vec3(+1, 0, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(+dx, -dy, -dz), normal: vec3(+1, 0, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(+dx, +dy, -dz), normal: vec3(+1, 0, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(+dx, +dy, +dz), normal: vec3(+1, 0, 0), texcoord: vec2(0, 1) }, idx++),
        // back
        makeVertex({ position: vec3(+dx, -dy, -dz), normal: vec3(0, 0, -1), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(-dx, -dy, -dz), normal: vec3(0, 0, -1), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(-dx, +dy, -dz), normal: vec3(0, 0, -1), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(+dx, +dy, -dz), normal: vec3(0, 0, -1), texcoord: vec2(0, 1) }, idx++),
        // left
        makeVertex({ position: vec3(-dx, -dy, -dz), normal: vec3(-1, 0, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(-dx, -dy, +dz), normal: vec3(-1, 0, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(-dx, +dy, +dz), normal: vec3(-1, 0, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(-dx, +dy, -dz), normal: vec3(-1, 0, 0), texcoord: vec2(0, 1) }, idx++),
        // bottom
        makeVertex({ position: vec3(-dx, -dy, -dz), normal: vec3(0, -1, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(+dx, -dy, -dz), normal: vec3(0, -1, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(+dx, -dy, +dz), normal: vec3(0, -1, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(-dx, -dy, +dz), normal: vec3(0, -1, 0), texcoord: vec2(0, 1) }, idx++),
        // top
        makeVertex({ position: vec3(-dx, +dy, +dz), normal: vec3(0, +1, 0), texcoord: vec2(0, 0) }, idx++),
        makeVertex({ position: vec3(+dx, +dy, +dz), normal: vec3(0, +1, 0), texcoord: vec2(1, 0) }, idx++),
        makeVertex({ position: vec3(+dx, +dy, -dz), normal: vec3(0, +1, 0), texcoord: vec2(1, 1) }, idx++),
        makeVertex({ position: vec3(-dx, +dy, -dz), normal: vec3(0, +1, 0), texcoord: vec2(0, 1) }, idx++),
    ];
    const indices: number[] = [];
    for (let i = 0; i < 6; ++i) {
        const b = i * 4;
        indices.push(b + 0, b + 1, b + 2, b + 2, b + 3, b + 0);
    }

    return { vertices, indices };
}

export function generateSphere<T>(
    size: Vec3, makeVertex: VertexMaker<T>, partition: number = 4,
): VertexIndexData<T> {
    const step = Math.PI / partition;
    const lonCount = 2 * partition;
    const cosList: number[] = [];
    const sinList: number[] = [];
    for (let i = 0; i <= lonCount; ++i) {
        cosList[i] = Math.cos(i * step);
        sinList[i] = Math.sin(i * step);
    }
    const { x: rx, y: ry, z: rz } = mul3(size, 0.5, _v3_scratch as Vec3Mut);

    const vertices: T[] = [];
    const indices: number[] = [];

    vertices.push(
        makeVertex(
            { position: vec3(0, +ry, 0), normal: vec3(0, +1, 0), texcoord: vec2(0, 1) },
            vertices.length,
        ),
    );
    for (let i = 1; i < partition; ++i) {
        for (let j = 0; j <= lonCount; ++j) {
            const position = vec3(
                rx * sinList[i] * sinList[j],
                ry * cosList[i],
                rz * sinList[i] * cosList[j],
            );

            const v1 = vec3(
                rx * +cosList[i] * sinList[j],
                ry * -sinList[i],
                rz * +cosList[i] * cosList[j],
            );
            const v2 = vec3(
                rx * sinList[i] * +cosList[j],
                0,
                rz * sinList[i] * -sinList[j],
            );
            const normal = norm3(cross3(v1, v2, _v3_scratch as Vec3Mut));

            const texcoord = vec2(j / lonCount, 1 - i / partition);

            vertices.push(makeVertex({ position, normal, texcoord }, vertices.length));
        }
    }
    vertices.push(
        makeVertex(
            { position: vec3(0, -ry, 0), normal: vec3(0, -1, 0), texcoord: vec2(0, 0) },
            vertices.length,
        ),
    );

    const firstIdx = 0;
    const lastIdx = vertices.length - 1;
    let idx = 1;
    for (let j = 0; j < lonCount; ++j) {
        const j1 = j + 1;
        indices.push(firstIdx, idx + j, idx + j1);
    }
    for (let i = 1; i < partition - 1; ++i) {
        for (let j = 0; j < lonCount; ++j) {
            const j1 = j + 1;
            const idx1 = idx + lonCount + 1;
            indices.push(
                idx + j, idx1 + j, idx1 + j1,
                idx1 + j1, idx + j1, idx + j,
            );
        }
        idx += lonCount + 1;
    }
    for (let j = 0; j < lonCount; ++j) {
        const j1 = j + 1;
        indices.push(lastIdx, idx + j1, idx + j);
    }

    return { vertices, indices };
}
