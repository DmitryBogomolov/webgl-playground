import type { Runtime, Color, Vec2, Vec4 } from 'lib';
import type { SetPointsResult, UpdatePointResult } from '../line';
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

    protected override _setPoints(points: ArrayLike<Vec2>): SetPointsResult {
        const segmentCount = points.length - 1;
        const clr = this._color;
        const vertexData = writeVertexData(
            {
                length: segmentCount * 4,
                * [Symbol.iterator]() {
                    for (let i = 0; i < segmentCount; ++i) {
                        yield* makeSegmentVertices(points, i, clr);
                    }
                },
            },
            vertexSchema,
            eigen,
        );

        const list: number[] = [];
        for (let i = 0; i < segmentCount; ++i) {
            makeIndexes(list, i * 4);
        }

        return { vertexData: vertexData.buffer, indexData: new Uint16Array(list).buffer };
    }

    protected override _updatePoint(points: ArrayLike<Vec2>, idx: number): UpdatePointResult {
        // Vertex k affects segments (k-1, k) and (k, k+1) as part of segments.
        const startSegmentIdx = Math.max(idx - 1, 0);
        const endSegmentIdx = Math.min(idx, points.length - 2);
        const clr = this._color;
        const vertexData = writeVertexData(
            {
                length: (endSegmentIdx - startSegmentIdx + 1) * 4,
                * [Symbol.iterator]() {
                    for (let i = startSegmentIdx; i <= endSegmentIdx; ++i) {
                        yield* makeSegmentVertices(points, i, clr);
                    }
                },
            },
            vertexSchema,
            eigen,
            this._buffer,
        ).buffer;
        const offset = startSegmentIdx * 4 * vertexSchema.vertexSize;
        // TODO_THIS: Use views.
        const data = vertexData.slice(0, (endSegmentIdx - startSegmentIdx + 1) * 4 * vertexSchema.vertexSize);
        return { vertexData: data, offset };
    }
}

type RoundVertex = Readonly<[Vec4, Vec2, Color]>;

function eigen(v: RoundVertex): RoundVertex {
    return v;
}

function makePositionAttr(position: Vec2, crossSide: number, lateralSide: number): Vec4 {
    return vec4(position.x, position.y, crossSide, lateralSide);
}

function* makeSegmentVertices(vertices: ArrayLike<Vec2>, segmentIdx: number, clr: Color): Iterable<RoundVertex> {
    const start = vertices[segmentIdx];
    const end = vertices[segmentIdx + 1];

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
