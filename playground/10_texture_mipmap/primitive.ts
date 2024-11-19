import type { VertexSchemaDefinition, Runtime } from 'lib';
import { Primitive, Program } from 'lib';
import vertShader from './shaders/texture.vert';
import fragShader from './shaders/texture.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });

    const vertexData = new Float32Array([
        -0.5, -0.5,
        +0.5, -0.5,
        +0.5, +0.5,
        -0.5, +0.5,
    ]);
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);
    const vertexSchema: VertexSchemaDefinition = {
        attributes: [{ type: 'float2' }],
    };
    primitive.setup({ vertexData, indexData, vertexSchema });

    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);
    return primitive;
}
