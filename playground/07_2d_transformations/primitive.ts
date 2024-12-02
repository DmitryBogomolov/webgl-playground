import type { Runtime, Color, Vec2 } from 'lib';
import { Primitive, Program, parseVertexSchema, vec2, writeVertexData } from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

export interface PrimitiveFactory {
    (clr: Color): Primitive;
}

export function makePrimitiveFactory(runtime: Runtime): PrimitiveFactory {
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float2' },
            { type: 'ubyte3', normalized: true },
        ],
    });
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
        const vertexData = writeVertexData(points, vertexSchema, (point) => ([point, clr]));
        const indexData = new Uint16Array([0, 1, 2]);

        primitive.setup({ vertexData, indexData, vertexSchema });
        primitive.setProgram(program);

        return primitive;
    };
}
