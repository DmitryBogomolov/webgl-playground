import {
    Runtime,
    Primitive,
    Program,
    generateCube, generateSphere, generatePlaneX, generatePlaneY, generatePlaneZ,
    VertexIndexData, VertexData, VertexMaker,
    parseVertexSchema, VertexSchema,
    VertexWriter,
    vec2,
    Vec3,
    Mat4, translation4x4,
    Color,
} from 'lib';
import objectVertShader from './shader/object.vert';
import objectFragShader from './shader/object.frag';
import outlineVertShader from './shader/outline.vert';
import outlineFragShader from './shader/outline.frag';

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

export function makeModels(runtime: Runtime, list: ReadonlyArray<ModelOptions>): {
    models: Model[],
    objectProgram: Program,
    outlineProgram: Program,
} {
    const models: Model[] = [];

    const schema = parseVertexSchema([
        { name: 'a_position', type: 'float3' },
        { name: 'a_normal', type: 'float3' },
    ]);
    const objectProgram = new Program(runtime, {
        vertShader: objectVertShader,
        fragShader: objectFragShader,
        schema,
    });
    const outlineProgram = new Program(runtime, {
        vertShader: outlineVertShader,
        fragShader: outlineFragShader,
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
        const primitive = makePrimitive(runtime, schema, vertexIndexData!);
        const mat = translation4x4(location);
        models.push({
            primitive,
            mat,
            color,

        });
    }

    return { models, objectProgram, outlineProgram };
}

function makePrimitive(
    runtime: Runtime, schema: VertexSchema, { vertices, indices }: VertexIndexData<VertexData>,
): Primitive {
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

    return primitive;
}
