import {
    handleWindowResize,
    RenderLoop,
    VertexWriter,
    parseVertexSchema,
    logSilenced,
    Runtime,
    Primitive,
    Program,
} from 'lib';
import vertexShaderSource from './shaders/shader.vert';
import fragmentShaderSource from './shaders/shader.frag';

/**
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

const vertices = [
    { position: [-0.5, -0.5], color: [1, 0, 0], factor: 0.5 },
    { position: [+0.5, -0.5], color: [0, 0, 1], factor: 0.6 },
    { position: [+0.5, +0.5], color: [1, 0, 0], factor: 0.7 },
    { position: [-0.5, +0.5], color: [0, 0, 1], factor: 0.8 },
];
const indices = [0, 1, 2, 2, 3, 0];

function makeAoSPrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float2' },
        { name: 'a_color', type: 'ubyte3', normalized: true },
        { name: 'a_factor', type: 'ubyte1', normalized: true },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive(runtime);

    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, color, factor } = vertices[i];
        writer.writeAttribute(i, 'a_position', position);
        writer.writeAttribute(i, 'a_color', color);
        writer.writeAttribute(i, 'a_factor', [factor]);
    }

    primitive.setData(vertexData, new Uint16Array(indices));
    primitive.setProgram(program);

    return primitive;
}

function makeSoAPrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        { name: 'a_color', type: 'ubyte3', normalized: true, offset: 0, stride: 4 },
        { name: 'a_position', type: 'float2', offset: 16, stride: 8 },
        { name: 'a_factor', type: 'ubyte1', normalized: true, offset: 48, stride: 4 },
    ]);
    const program = new Program(runtime, {
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        schema,
    });
    const primitive = new Primitive(runtime);

    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        const { position, color, factor } = vertices[i];
        writer.writeAttribute(i, 'a_position', position);
        writer.writeAttribute(i, 'a_color', color);
        writer.writeAttribute(i, 'a_factor', [factor]);
    }

    primitive.setData(vertexData, new Uint16Array(indices));
    primitive.setProgram(program);

    return primitive;
}

const runtime = new Runtime(container);
const aosPrimitive = makeAoSPrimitive(runtime);
const soaPrimitive = makeSoAPrimitive(runtime);

const loop = new RenderLoop(() => {
    aosPrimitive.draw({
        'u_offset': [-0.5, -0.5],
    });
    soaPrimitive.draw({
        'u_offset': [+0.5, +0.5],
    });
});
loop.start();
logSilenced(true);

handleWindowResize(() => {
    runtime.adjustViewport();
});
