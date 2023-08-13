import type { Runtime, Color, Vec2, PrimitiveVertexSchema } from 'lib';
import { Primitive, Program, VertexWriter, vec2 } from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

export interface PrimitiveFactory {
    (clr: Color): Primitive;
}

export function makePrimitiveFactory(runtime: Runtime): PrimitiveFactory {
    const schema: PrimitiveVertexSchema = {
        attributes: [
            { type: 'float2' },
            { type: 'ubyte3', normalized: true },
        ],
    };
    const VERTEX_SIZE = 12;
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });

    const angle = Math.PI / 4;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    const points: Vec2[] = [
        vec2(0, 1),
        vec2(-dx, -dy),
        vec2(+dx, -dy),
    ];

    return (clr) => {
        const primitive = new Primitive({ runtime });
        const vertexData = new ArrayBuffer(points.length * VERTEX_SIZE);
        const writer = new VertexWriter(schema, vertexData);
        for (let i = 0; i < points.length; ++i) {
            writer.writeAttribute(i, 0, points[i]);
            writer.writeAttribute(i, 1, clr);
        }
        const indexData = new Uint16Array([0, 1, 2]);

        primitive.allocateVertexBuffer(vertexData.byteLength);
        primitive.updateVertexData(vertexData);
        primitive.allocateIndexBuffer(indexData.byteLength);
        primitive.updateIndexData(indexData);
        primitive.setVertexSchema(schema);
        primitive.setIndexConfig({ indexCount: indexData.length });
        primitive.setProgram(program);

        return primitive;
    };
}
