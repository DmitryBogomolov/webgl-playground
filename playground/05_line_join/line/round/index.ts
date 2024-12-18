import type { Runtime, Color, Vec2, Vec4 } from 'lib';
import { parseVertexSchema, vec4, writeVertexData } from 'lib';
import { LineBase } from '../line';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';
import { Vertex } from 'playground/05_line_join/vertex';

const vertexSchema = parseVertexSchema({
    attributes: [
        { type: 'float4' },
        { type: 'float2' },
        { type: 'ubyte4', normalized: true },
    ],
});

export class RoundLine extends LineBase {
    private readonly _buffer = new Uint8Array(2 * 4 * vertexSchema.vertexSize);

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
        }
        return new Uint16Array(list);
    }

    protected _updateVertex(vertices: ReadonlyArray<Vertex>, idx: number): [ArrayBuffer, number] {
        // Vertex k affects segments (k-1, k) and (k, k+1) as part of segments.
        const startIdx = Math.max(idx - 1, 0);
        const endIdx = Math.min(idx, vertices.length - 2);
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

type RoundVertex = [Vec4, Vec2, Color];

function eigen(v: RoundVertex): RoundVertex {
    return v;
}

function makePositionAttr(position: Vec2, crossSide: number, lateralSide: number): Vec4 {
    return vec4(position.x, position.y, crossSide, lateralSide);
}

function* makeVertices(vertices: ReadonlyArray<Vertex>, i: number): Iterable<RoundVertex> {
    const start = vertices[i];
    const end = vertices[i + 1];

    const startOther = end.position;
    const endOther = start.position;
    const startColor = start.color;
    const endColor = end.color;

    yield [makePositionAttr(start.position, +1, -1), startOther, startColor];
    yield [makePositionAttr(start.position, -1, -1), startOther, startColor];
    // In end-start direction (-1) is (+1) in start-end direction
    yield [makePositionAttr(end.position, -1, +1), endOther, endColor];
    yield [makePositionAttr(end.position, +1, +1), endOther, endColor];
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
