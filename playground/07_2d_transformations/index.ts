import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
    VertexWriter,
    color,
    colors,
    vec2,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

/**
 * 2D Transformations.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);
runtime.onRender(() => {
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.clearColorBuffer();
    const program = primitive.program();
    program.setUniform('u_transform', [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    primitive.render();
});

function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
        { name: 'a_color', type: 'ubyte3', normalized: true },
    ]);

    const vertexData = new ArrayBuffer(4 * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    writer.writeAttribute(0, 'a_position', vec2(0, +0.3));
    writer.writeAttribute(1, 'a_position', vec2(-0.2, 0));
    writer.writeAttribute(2, 'a_position', vec2(0, -0.3));
    writer.writeAttribute(3, 'a_position', vec2(+0.2, 0));
    writer.writeAttribute(0, 'a_color', colors.BLUE);
    writer.writeAttribute(1, 'a_color', colors.BLUE);
    writer.writeAttribute(2, 'a_color', colors.BLUE);
    writer.writeAttribute(3, 'a_color', colors.BLUE);

    const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setIndexCount(indexData.length);

    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    primitive.setProgram(program);
    return primitive;
}
