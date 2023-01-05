import type { Vec2 } from '../geometry/vec2.types';
import type { Vec3 } from '../geometry/vec3.types';

export interface VertexData {
    readonly position: Vec3;
    readonly normal: Vec3;
    readonly texcoord: Vec2;
}

export interface VertexMaker<T> {
    (vertex: VertexData, idx: number): T;
}

export interface VertexIndexData<T> {
    readonly vertices: ReadonlyArray<T>;
    readonly indices: ReadonlyArray<number>;
}
