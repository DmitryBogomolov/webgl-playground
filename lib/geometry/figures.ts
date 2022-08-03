import { Vec3, vec3, mul3, norm3, cross3 } from './vec3';

export interface VertexIndexData<T> {
    readonly vertices: ReadonlyArray<T>;
    readonly indices: ReadonlyArray<number>;
}

export function generateCube<T>(
    size: Vec3,
    makeVertex: (position: Vec3, normal: Vec3, idx: number) => T,
): VertexIndexData<T> {
    const { x: dx, y: dy, z: dz } = mul3(size, 0.5);

    let idx = 0;
    const vertices = [
        // front
        makeVertex(vec3(-dx, -dy, +dz), vec3(0, 0, +1), idx++),
        makeVertex(vec3(+dx, -dy, +dz), vec3(0, 0, +1), idx++),
        makeVertex(vec3(+dx, +dy, +dz), vec3(0, 0, +1), idx++),
        makeVertex(vec3(-dx, +dy, +dz), vec3(0, 0, +1), idx++),
        // right
        makeVertex(vec3(+dx, -dy, +dz), vec3(+1, 0, 0), idx++),
        makeVertex(vec3(+dx, -dy, -dz), vec3(+1, 0, 0), idx++),
        makeVertex(vec3(+dx, +dy, -dz), vec3(+1, 0, 0), idx++),
        makeVertex(vec3(+dx, +dy, +dz), vec3(+1, 0, 0), idx++),
        // back
        makeVertex(vec3(+dx, -dy, -dz), vec3(0, 0, -1), idx++),
        makeVertex(vec3(-dx, -dy, -dz), vec3(0, 0, -1), idx++),
        makeVertex(vec3(-dx, +dy, -dz), vec3(0, 0, -1), idx++),
        makeVertex(vec3(+dx, +dy, -dz), vec3(0, 0, -1), idx++),
        // left
        makeVertex(vec3(-dx, -dy, -dz), vec3(-1, 0, 0), idx++),
        makeVertex(vec3(-dx, -dy, +dz), vec3(-1, 0, 0), idx++),
        makeVertex(vec3(-dx, +dy, +dz), vec3(-1, 0, 0), idx++),
        makeVertex(vec3(-dx, +dy, -dz), vec3(-1, 0, 0), idx++),
        // bottom
        makeVertex(vec3(-dx, -dy, -dz), vec3(0, -1, 0), idx++),
        makeVertex(vec3(+dx, -dy, -dz), vec3(0, -1, 0), idx++),
        makeVertex(vec3(+dx, -dy, +dz), vec3(0, -1, 0), idx++),
        makeVertex(vec3(-dx, -dy, +dz), vec3(0, -1, 0), idx++),
        // top
        makeVertex(vec3(-dx, +dy, +dz), vec3(0, +1, 0), idx++),
        makeVertex(vec3(+dx, +dy, +dz), vec3(0, +1, 0), idx++),
        makeVertex(vec3(+dx, +dy, -dz), vec3(0, +1, 0), idx++),
        makeVertex(vec3(-dx, +dy, -dz), vec3(0, +1, 0), idx++),
    ];
    const indices: number[] = [];
    for (let i = 0; i < 6; ++i) {
        const b = i * 4;
        indices.push(b + 0, b + 1, b + 2, b + 2, b + 3, b + 0);
    }

    return { vertices, indices };
}

export function generateSphere<T>(
    size: Vec3,
    makeVertex: (position: Vec3, normal: Vec3, idx: number) => T,
    partition: number = 4,
): VertexIndexData<T> {
    const step = Math.PI / partition;
    const lonCount = 2 * partition;
    const cosList: number[] = [];
    const sinList: number[] = [];
    for (let i = 0; i < lonCount; ++i) {
        cosList[i] = Math.cos(i * step);
        sinList[i] = Math.sin(i * step);
    }
    const { x: rx, y: ry, z: rz } = mul3(size, 0.5);

    const vertices: T[] = [];
    const indices: number[] = [];

    vertices.push(makeVertex(vec3(0, +ry, 0), vec3(0, +1, 0), vertices.length));
    for (let i = 1; i < partition; ++i) {
        for (let j = 0; j < lonCount; ++j) {
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
            const normal = norm3(cross3(v1, v2));

            vertices.push(makeVertex(position, normal, vertices.length));
        }
    }
    vertices.push(makeVertex(vec3(0, -ry, 0), vec3(0, -1, 0), vertices.length));

    const firstIdx = 0;
    const lastIdx = vertices.length - 1;
    let idx = 1;
    for (let j = 0; j < lonCount; ++j) {
        const j1 = (j + 1) % lonCount;
        indices.push(firstIdx, idx + j, idx + j1);
    }
    for (let i = 1; i < partition - 1; ++i) {
        for (let j = 0; j < lonCount; ++j) {
            const j1 = (j + 1) % lonCount;
            const idx1 = idx + lonCount;
            indices.push(
                idx + j, idx1 + j, idx1 + j1,
                idx1 + j1, idx + j1, idx + j,
            );
        }
        idx += lonCount;
    }
    for (let j = 0; j < lonCount; ++j) {
        const j1 = (j + 1) % lonCount;
        indices.push(lastIdx, idx + j1, idx + j);
    }

    return { vertices, indices };
}
