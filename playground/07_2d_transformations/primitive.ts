import type { Runtime, Color, Vec2 } from 'lib';
import { Primitive, Program, VertexWriter, parseVertexSchema, vec2 } from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

export interface PrimitiveFactory {
    (clr: Color): Primitive;
}

export function makePrimitiveFactory(runtime: Runtime): PrimitiveFactory {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
        { name: 'a_color', type: 'ubyte3', normalized: true },
    ]);
    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
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
        const primitive = new Primitive(runtime);
        const vertexData = new ArrayBuffer(points.length * schema.totalSize);
        const writer = new VertexWriter(schema, vertexData);
        for (let i = 0; i < points.length; ++i) {
            writer.writeAttribute(i, 'a_position', points[i]);
            writer.writeAttribute(i, 'a_color', clr);
        }
        const indexData = new Uint16Array([0, 1, 2]);

        primitive.allocateVertexBuffer(vertexData.byteLength);
        primitive.updateVertexData(vertexData);
        primitive.allocateIndexBuffer(indexData.byteLength);
        primitive.updateIndexData(indexData);
        primitive.setVertexSchema(schema);
        primitive.setIndexData({ indexCount: indexData.length });
        primitive.setProgram(program);

        return primitive;
    };
}
