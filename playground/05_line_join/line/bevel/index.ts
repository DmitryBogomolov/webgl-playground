import type { Runtime, Color, Vec2, Vec3, Vec4 } from 'lib';
import type { Vertex } from '../../vertex';
import { parseVertexSchema, vec3, vec4, writeVertexData } from 'lib';
import { LineBase } from '../line';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';

const vertexSchema = parseVertexSchema({
    attributes: [
        { type: 'float3' },
        { type: 'float4' },
        { type: 'ubyte4', normalized: true },
    ],
});

export class BevelLine extends LineBase {
    private readonly _buffer = new Uint8Array(4 * 4 * vertexSchema.vertexSize);

    constructor(runtime: Runtime) {
        super(runtime, {
            vertexSchema,
            vertShader,
            fragShader,
        });
    }

    protected _writeVertices(vertices: ReadonlyArray<Vertex>): ArrayBuffer {
        return writeVertexData(
            {
                length: (vertices.length - 1) * 4,
                *[Symbol.iterator]() {
                    for (let i = 0; i < vertices.length - 1; ++i) {
                        yield *makeVertices(vertices, i);
                    }
                },
            },
            vertexSchema,
            eigen,
        );
    }

    protected _writeIndexes(vertexCount: number): ArrayBuffer {
        const list: number[] = [];
        const segmentCount = vertexCount - 1;
        for (let i = 0; i < segmentCount; ++i) {
            makeIndexes(list, i * 4);
            if (i < segmentCount - 1) {
                makeIndexes(list, i * 4 + 2);
            }
        }
        return new Uint16Array(list);
    }

    protected _updateVertex(vertices: ReadonlyArray<Vertex>, idx: number): [ArrayBuffer, number] {
        // Vertex k affects segments (k-1, k) and (k, k+1) as part of segments
        // and segments (k-2, k-1) and (k+1, k+2) as before/after part.
        const startIdx = Math.max(idx - 2, 0);
        const endIdx = Math.min(idx + 1, vertices.length - 2);
        const vertexData = writeVertexData(
            {
                length: (endIdx - startIdx + 1) * 4,
                *[Symbol.iterator]() {
                    for (let i = startIdx; i <= endIdx; ++i) {
                        yield *makeVertices(vertices, i);
                    }
                },
            },
            vertexSchema,
            eigen,
            this._buffer,
        );
        const offset = startIdx * 4 * vertexSchema.vertexSize;
        return [vertexData, offset];
    }
}

type BevelVertex = [Vec3, Vec4, Color];

function eigen(v: BevelVertex): BevelVertex {
    return v;
}

function makePositionAttr(position: Vec2, side: number): Vec3 {
    return vec3(position.x, position.y, side);
}

function makeOtherAttr(other: Vec2, outer: Vec2): Vec4 {
    return vec4(other.x, other.y, outer.x, outer.y);
}

function* makeVertices(vertices: ReadonlyArray<Vertex>, i: number): Iterable<BevelVertex> {
    const start = vertices[i];
    const end = vertices[i + 1];
    const before = vertices[i - 1] || end;
    const after = vertices[i + 2] || start;

    const startOther = makeOtherAttr(end.position, before.position);
    const endOther = makeOtherAttr(start.position, after.position);
    const startColor = start.color;
    const endColor = end.color;

    yield [makePositionAttr(start.position, +1), startOther, startColor];
    yield [makePositionAttr(start.position, -1), startOther, startColor];
    // In end-start direction (-1) is (+1) in start-end direction
    yield [makePositionAttr(end.position, -1), endOther, endColor];
    yield [makePositionAttr(end.position, +1), endOther, endColor];
}

function makeIndexes(list: number[], base: number): void {
    list.push(
        base + 0,
        base + 2,
        base + 3,
        base + 3,
        base + 1,
        base + 0,
    );
}
