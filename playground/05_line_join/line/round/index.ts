import type { Runtime, Color, Vec2, Vec4 } from 'lib';
import { parseVertexSchema, vec4, writeVertexData } from 'lib';
import { LineBase } from '../line';
import vertShader from './shaders/vert.glsl';
import fragShader from './shaders/frag.glsl';

const vertexSchema = parseVertexSchema({
    attributes: [
        { type: 'float4' },
        { type: 'float2' },
        { type: 'ubyte4', normalized: true },
    ],
});

export class RoundLine extends LineBase {
    private readonly _buffer = new Uint8Array(2 * 4 * vertexSchema.vertexSize);
    private readonly _color: Color;

    constructor(runtime: Runtime, clr: Color) {
        super(runtime, {
            vertexSchema,
            vertShader,
            fragShader,
        });
        this._color = clr;
    }

    protected _writeVertices(vertices: ReadonlyArray<Vec2>): ArrayBuffer {
        const clr = this._color;
        return writeVertexData(
            {
                length: (vertices.length - 1) * 4,
                *[Symbol.iterator]() {
                    for (let i = 0; i < vertices.length - 1; ++i) {
                        yield *makeVertices(vertices, i, clr);
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

    protected _updateVertex(vertices: ReadonlyArray<Vec2>, idx: number): [ArrayBuffer, number] {
        // Vertex k affects segments (k-1, k) and (k, k+1) as part of segments.
        const startIdx = Math.max(idx - 1, 0);
        const endIdx = Math.min(idx, vertices.length - 2);
        const clr = this._color;
        const vertexData = writeVertexData(
            {
                length: (endIdx - startIdx + 1) * 4,
                *[Symbol.iterator]() {
                    for (let i = startIdx; i <= endIdx; ++i) {
                        yield *makeVertices(vertices, i, clr);
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

function* makeVertices(vertices: ReadonlyArray<Vec2>, i: number, clr: Color): Iterable<RoundVertex> {
    const start = vertices[i];
    const end = vertices[i + 1];

    const startOther = end;
    const endOther = start;

    yield [makePositionAttr(start, +1, -1), startOther, clr];
    yield [makePositionAttr(start, -1, -1), startOther, clr];
    // In end-start direction (-1) is (+1) in start-end direction
    yield [makePositionAttr(end, -1, +1), endOther, clr];
    yield [makePositionAttr(end, +1, +1), endOther, clr];
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
