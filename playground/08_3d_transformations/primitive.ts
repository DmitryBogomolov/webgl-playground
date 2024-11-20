import type { Color } from 'lib';
import { Runtime, Primitive, Program, vec3, color, generateCube, parseVertexSchema, writeVertexData } from 'lib';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });

    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'ubyte3', normalized: true },
        ],
    });
    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });

    const k1 = 0.7;
    const k2 = 0.1;
    const c1 = color(k1, k1, k2);
    const c2 = color(k2, k1, k1);
    const c3 = color(k1, k2, k1);
    const c4 = color(k2, k2, k1);
    const c5 = color(k1, k2, k2);
    const c6 = color(k2, k1, k2);
    const clrs: Record<string, Color> = {
        '001': c1,
        '100': c2,
        '00-1': c3,
        '-100': c4,
        '0-10': c5,
        '010': c6,
    };
    const { vertices, indices } = generateCube(vec3(1, 0.8, 0.6), ({ position, normal }) => {
        const key = `${normal.x | 0}${normal.y | 0}${normal.z | 0}`;
        return { pos: position, clr: clrs[key] };
    });

    const vertexData = writeVertexData(vertices, vertexSchema, (vertex) => ([vertex.pos, vertex.clr]));
    const indexData = new Uint16Array(indices);

    primitive.setup({ vertexData, indexData, vertexSchema });
    primitive.setProgram(program);
    return primitive;
}
