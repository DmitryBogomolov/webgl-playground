import type { Runtime, VertexData, VertexIndexData, Vec3, Mat4, Color } from 'lib';
import {
    Primitive,
    Program,
    generateCube, generateSphere, generatePlaneX, generatePlaneY, generatePlaneZ,
    vec2,
    norm3, add3,
    translation4x4,
    parseVertexSchema,
    writeVertexData,
} from 'lib';
import objectVertShader from './shaders/object.vert';
import objectFragShader from './shaders/object.frag';
import outlineVertShader from './shaders/outline.vert';
import outlineFragShader from './shaders/outline.frag';
import idVertShader from './shaders/id.vert';
import idFragShader from './shaders/id.frag';

export interface Model {
    readonly primitive: Primitive;
    readonly mat: Mat4;
    readonly color: Color;
    readonly id: number;
}

export interface ModelOptions {
    readonly type: 'sphere' | 'cube' | 'plane';
    readonly size: Vec3;
    readonly location: Vec3;
    readonly color: Color;
}

interface VertexInfo {
    readonly position: Vec3;
    readonly normal: Vec3;
    // Se notes in shader.
    readonly offset: Vec3;
}

export function makeModels(runtime: Runtime, list: ReadonlyArray<ModelOptions>): {
    models: Model[],
    objectProgram: Program,
    outlineProgram: Program,
    idProgram: Program,
    disposeModels: () => void,
} {
    const models: Model[] = [];

    const objectProgram = new Program({
        runtime,
        vertShader: objectVertShader,
        fragShader: objectFragShader,
    });
    const outlineProgram = new Program({
        runtime,
        vertShader: outlineVertShader,
        fragShader: outlineFragShader,
    });
    const idProgram = new Program({
        runtime,
        vertShader: idVertShader,
        fragShader: idFragShader,
    });

    let nextObjectId = 2001;
    for (const { type, size, location, color } of list) {
        let vertexIndexData: VertexIndexData<VertexInfo>;
        switch (type) {
        case 'cube':
            vertexIndexData = generateCube(size, makeCubeVertexInfo);
            break;
        case 'sphere':
            vertexIndexData = generateSphere(size, makeSphereVertexInfo, 12);
            break;
        case 'plane':
            switch (0) {
            case size.x:
                vertexIndexData = generatePlaneX(vec2(size.y, size.z), makePlaneVertexInfo);
                break;
            case size.y:
                vertexIndexData = generatePlaneY(vec2(size.x, size.z), makePlaneVertexInfo);
                break;
            case size.z:
                vertexIndexData = generatePlaneZ(vec2(size.x, size.y), makePlaneVertexInfo);
                break;
            }
        }
        const primitive = makePrimitive(runtime, vertexIndexData!);
        const mat = translation4x4(location);
        models.push({
            primitive,
            mat,
            color,
            id: nextObjectId++,
        });
    }

    return { models, objectProgram, outlineProgram, idProgram, disposeModels };

    function disposeModels(): void {
        objectProgram.dispose();
        outlineProgram.dispose();
        idProgram.dispose();
        for (const model of models) {
            model.primitive.dispose();
        }
    }
}

function makeCubeVertexInfo({ position, normal }: VertexData): VertexInfo {
    return {
        position,
        normal,
        offset: norm3(position),
    };
}

function makeSphereVertexInfo({ position, normal }: VertexData): VertexInfo {
    return {
        position,
        normal,
        offset: normal,
    };
}

function makePlaneVertexInfo({ position, normal }: VertexData): VertexInfo {
    return {
        position,
        normal,
        offset: norm3(add3(norm3(position), normal)),
    };
}

function makePrimitive(runtime: Runtime, { vertices, indices }: VertexIndexData<VertexInfo>): Primitive {
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
            { type: 'float3' },
        ],
    });

    const vertexData = writeVertexData(
        vertices,
        vertexSchema,
        (vertex) => ([vertex.position, vertex.normal, vertex.offset]),
    );
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive({ runtime });
    primitive.setup({ vertexData, indexData, vertexSchema });

    return primitive;
}
