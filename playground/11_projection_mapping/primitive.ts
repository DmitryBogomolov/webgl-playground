import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema,
} from 'lib';
import vertexShader from './shaders/mapping.vert';
import fragmentShader from './shaders/mapping.frag';

export function makePrimitive(runtime: Runtime): Primitive {
    const primitive = new Primitive(runtime);

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
    ]);

    const program = new Program(runtime, {
        vertexShader,
        fragmentShader,
        schema,
    });

    primitive.setVertexSchema(schema);
    primitive.setProgram(program);

    return primitive;
}
