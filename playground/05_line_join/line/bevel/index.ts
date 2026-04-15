import type { Runtime, Color, Vec2, Vec3, Vec4 } from 'lib';
import type { SetPointsResult, UpdatePointResult } from '../line';
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
            if (i < segmentCount - 1) {
                makeIndexes(list, i * 4 + 2);
            }
        }

        return { vertexData: vertexData.buffer, indexData: new Uint16Array(list).buffer };
    }

    protected override _updatePoint(points: ArrayLike<Vec2>, idx: number): UpdatePointResult {
        // Vertex k affects segments (k-1, k) and (k, k+1) as part of segments
        // and segments (k-2, k-1) and (k+1, k+2) as before/after part.
        const startSegmentIdx = Math.max(idx - 2, 0);
        const endSegmentIdx = Math.min(idx + 1, points.length - 2);
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

type BevelVertex = Readonly<[Vec3, Vec4, Color]>;

function eigen(v: BevelVertex): BevelVertex {
    return v;
}

function makePositionAttr(position: Vec2, side: number): Vec3 {
    return vec3(position.x, position.y, side);
}

function makeOtherAttr(other: Vec2, outer: Vec2): Vec4 {
    return vec4(other.x, other.y, outer.x, outer.y);
}

function* makeSegmentVertices(vertices: ArrayLike<Vec2>, segmentIdx: number, clr: Color): Iterable<BevelVertex> {
    const start = vertices[segmentIdx];
    const end = vertices[segmentIdx + 1];
    const before = vertices[segmentIdx - 1] || end;
    const after = vertices[segmentIdx + 2] || start;

    const startOther = makeOtherAttr(end, before);
    const endOther = makeOtherAttr(start, after);

    yield [makePositionAttr(start, +1), startOther, clr];
    yield [makePositionAttr(start, -1), startOther, clr];
    // In end-start direction (-1) is (+1) in start-end direction
    yield [makePositionAttr(end, -1), endOther, clr];
    yield [makePositionAttr(end, +1), endOther, clr];
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
