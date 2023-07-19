import type { Runtime } from 'lib';
import { Primitive, Program } from 'lib';
import vertShader from './shaders/texture.vert';
import fragShader from './shaders/texture.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const vertices = new Float32Array([
        -0.5, -0.5,
        +0.5, -0.5,
        +0.5, +0.5,
        -0.5, +0.5,
    ]);
    const indices = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);
    primitive.allocateVertexBuffer(vertices.byteLength);
    primitive.updateVertexData(vertices);
    primitive.allocateIndexBuffer(indices.byteLength);
    primitive.updateIndexData(indices);
    primitive.setVertexSchema({
        attributes: [{ type: 'float2' }],
    });
    primitive.setIndexConfig({
        indexCount: indices.length,
    });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);
    return primitive;
}
