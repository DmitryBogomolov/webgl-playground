import {
    parseVertexSchema,
    Primitive,
    Program,
    Runtime,
    VertexWriter,
} from 'lib';
import vertexShaderSource from './shaders/vert.glsl';
import fragmentShaderSource from './shaders/frag.glsl';

const container = document.querySelector<HTMLDivElement>(PLAYGROUND_ROOT)!;

type Position = readonly [number, number];

function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_other', type: 'float3' },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });

    const vertices: Position[] = [
        [-0.7, -0.8],
        [-0.1, +0.5],
        [+0.4, -0.5],
        [+0.8, +0.6],
    ];
    const segmentCount = vertices.length - 1;
    const vertexData = new ArrayBuffer(schema.totalSize * segmentCount * 4);
    const writer = new VertexWriter(schema, vertexData);
    const indexData = new Uint16Array(6 * segmentCount);
    for (let i = 0; i < segmentCount; ++i) {
        const vertexBase = i * 4;
        const indexBase = i * 6;
        const start = vertices[i];
        const end = vertices[i + 1];

        writer.writeAttribute(vertexBase + 0, 'a_position', [...start, -1]);
        writer.writeAttribute(vertexBase + 1, 'a_position', [...start, +1]);
        writer.writeAttribute(vertexBase + 2, 'a_position', [...end, -1]);
        writer.writeAttribute(vertexBase + 3, 'a_position', [...end, +1]);
        writer.writeAttribute(vertexBase + 0, 'a_other', [...end, +1]);
        writer.writeAttribute(vertexBase + 1, 'a_other', [...end, +1]);
        writer.writeAttribute(vertexBase + 2, 'a_other', [...start, -1]);
        writer.writeAttribute(vertexBase + 3, 'a_other', [...start, -1]);

        indexData[indexBase + 0] = vertexBase + 0;
        indexData[indexBase + 1] = vertexBase + 1;
        indexData[indexBase + 2] = vertexBase + 3;
        indexData[indexBase + 3] = vertexBase + 3;
        indexData[indexBase + 4] = vertexBase + 2;
        indexData[indexBase + 5] = vertexBase + 0;
    }

    primitive.setProgram(program);
    primitive.setData(vertexData, indexData);

    return primitive;
}

const runtime = new Runtime(container);
const primitive = makePrimitive(runtime);
runtime.onRender(() => {
    runtime.clearColor();
    primitive.draw();
});
