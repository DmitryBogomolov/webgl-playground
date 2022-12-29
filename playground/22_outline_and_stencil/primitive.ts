import {
    Runtime,
    Primitive,
    Program,
    generateCube, generateSphere, generatePlaneX, generatePlaneY, generatePlaneZ,
    VertexIndexData, VertexData, VertexMaker,
    parseVertexSchema,
    VertexWriter,
    vec2,
    Vec3,
    Mat4, translation4x4,
    Color,
} from 'lib';
import vertShader from './shader/object.vert';
import fragShader from './shader/object.frag';

export interface Model {
    readonly primitive: Primitive;
    readonly mat: Mat4;
    readonly color: Color;
}

export interface ModelOptions {
    readonly type: 'sphere' | 'cube' | 'plane';
    readonly size: Vec3;
    readonly location: Vec3;
    readonly color: Color;
}

export function makeModels(runtime: Runtime, list: ReadonlyArray<ModelOptions>): Model[] {
    const models: Model[] = [];

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);
    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
    });

    const makeVertex: VertexMaker<VertexData> = (vertex) => vertex;

    for (const { type, size, location, color } of list) {
        let vertexIndexData: VertexIndexData<VertexData>;
        switch (type) {
        case 'cube':
            vertexIndexData = generateCube(size, makeVertex);
            break;
        case 'sphere':
            vertexIndexData = generateSphere(size, makeVertex);
            break;
        case 'plane':
            switch (0) {
            case size.x:
                vertexIndexData = generatePlaneX(vec2(size.y, size.z), makeVertex);
                break;
            case size.y:
                vertexIndexData = generatePlaneY(vec2(size.x, size.z), makeVertex);
                break;
            case size.z:
                vertexIndexData = generatePlaneZ(vec2(size.x, size.y), makeVertex);
                break;
            }
        }
        const primitive = makePrimitive(runtime, program, vertexIndexData!);
        const mat = translation4x4(location);
        models.push({
            primitive,
            mat,
            color,

        });
    }

    return models;
}

function makePrimitive(
    runtime: Runtime, program: Program, { vertices, indices }: VertexIndexData<VertexData>,
): Primitive {
    const schema = program.schema();
    const vertexData = new ArrayBuffer(schema.totalSize * vertices.length);
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

    primitive.setProgram(program);

    return primitive;
}
