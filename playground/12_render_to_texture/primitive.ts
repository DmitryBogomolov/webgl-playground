import type { Runtime } from 'lib';
import {
    Primitive,
    Program,
    vec2,
    UNIT3,
    generateCube, generatePlaneZ,
    parseVertexSchema,
    writeVertexData,
} from 'lib';
import objectVertShader from './shaders/object.vert';
import objectFragShader from './shaders/object.frag';
import texturePlaneVertShader from './shaders/texture-plane.vert';
import texturePlaneFragShader from './shaders/texture-plane.frag';

export function makeObject(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });

    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
        ],
    });

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = writeVertexData(vertices, vertexSchema, (vertex) => ([vertex.position, vertex.normal]));
    const indexData = new Uint16Array(indices);
    primitive.setup({ vertexData, indexData, vertexSchema });

    const program = new Program({
        runtime,
        vertShader: objectVertShader,
        fragShader: objectFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeTexturePlane(runtime: Runtime): Primitive {
    const primitive = new Primitive({ runtime });

    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float2' },
        ],
    });

    const { vertices, indices } = generatePlaneZ(vec2(2, 2), (vertex) => vertex);
    const vertexData = writeVertexData(vertices, vertexSchema, (vertex) => ([vertex.position, vertex.texcoord]));
    const indexData = new Uint16Array(indices);
    primitive.setup({ vertexData, indexData, vertexSchema });

    const program = new Program({
        runtime,
        vertShader: texturePlaneVertShader,
        fragShader: texturePlaneFragShader,
    });
    primitive.setProgram(program);

    return primitive;
}
