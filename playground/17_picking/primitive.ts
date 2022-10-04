import {
    Runtime,
    Primitive,
    Program,
    parseVertexSchema, VertexWriter,
    generateCube,
    Vec3, UNIT3,
    Mat4, identity4x4, apply4x4, scaling4x4, rotation4x4, translation4x4, inversetranspose4x4,
} from 'lib';
import itemVertShader from './shaders/item.vert';
import itemFragShader from './shaders/item.frag';
import idVertShader from './shaders/id.vert';
import idFragShader from './shaders/id.frag';

export interface SceneItem {
    readonly primitive: Primitive;
    readonly modelMat: Mat4;
    readonly normalMat: Mat4;
}

export interface ObjectsFactory {
    make(size: Vec3, axis: Vec3, rotation: number, position: Vec3): SceneItem;
    readonly program: Program;
    readonly idProgram: Program;
}

export function makeObjectsFactory(runtime: Runtime): ObjectsFactory {
    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = new ArrayBuffer(vertices.length * schema.totalSize);
    const writer = new VertexWriter(schema, vertexData);
    for (let i = 0; i < vertices.length; ++i) {
        writer.writeAttribute(i, 'a_position', vertices[i].position);
        writer.writeAttribute(i, 'a_normal', vertices[i].normal);
    }
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive(runtime);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertShader: itemVertShader,
        fragShader: itemFragShader,
        schema,
    });
    const idProgram = new Program(runtime, {
        vertShader: idVertShader,
        fragShader: idFragShader,
        schema,
    });

    return {
        make: (size, axis, rotation, position) => {
            const mat = identity4x4();
            apply4x4(mat, scaling4x4, size);
            apply4x4(mat, rotation4x4, axis, rotation);
            apply4x4(mat, translation4x4, position);
            return {
                primitive,
                modelMat: mat,
                normalMat: inversetranspose4x4(mat),
            };
        },
        program,
        idProgram,
    };
}
