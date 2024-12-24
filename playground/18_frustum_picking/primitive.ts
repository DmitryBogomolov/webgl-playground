import type { Runtime, Vec3, Mat4, Mat4Mut } from 'lib';
import {
    Primitive,
    Program,
    generateCube,
    UNIT3, identity4x4, apply4x4, scaling4x4, rotation4x4, translation4x4, inversetranspose4x4,
    parseVertexSchema,
    writeVertexData,
} from 'lib';
import itemVertShader from './shaders/item.vert';
import itemFragShader from './shaders/item.frag';
import idVertShader from './shaders/id.vert';
import idFragShader from './shaders/id.frag';

export interface SceneItem {
    readonly primitive: Primitive;
    readonly id: number;
    readonly modelMat: Mat4;
    readonly normalMat: Mat4;
}

export interface ObjectsFactory {
    make(id: number, size: Vec3, axis: Vec3, rotation: number, position: Vec3): SceneItem;
    dispose(): void;
    readonly program: Program;
    readonly idProgram: Program;
}

export function makeObjectsFactory(runtime: Runtime): ObjectsFactory {
    const vertexSchema = parseVertexSchema({
        attributes: [
            { type: 'float3' },
            { type: 'float3' },
        ],
    });

    const { vertices, indices } = generateCube(UNIT3, (vertex) => vertex);
    const vertexData = writeVertexData(vertices, vertexSchema, (vertex) => ([vertex.position, vertex.normal]));
    const indexData = new Uint16Array(indices);

    const primitive = new Primitive({ runtime });
    primitive.setup({ vertexData, indexData, vertexSchema });

    const program = new Program({
        runtime,
        vertShader: itemVertShader,
        fragShader: itemFragShader,
    });
    const idProgram = new Program({
        runtime,
        vertShader: idVertShader,
        fragShader: idFragShader,
    });

    return {
        make: (id, size, axis, rotation, position) => {
            const mat = identity4x4() as Mat4Mut;
            apply4x4(mat, scaling4x4, size);
            apply4x4(mat, rotation4x4, axis, rotation);
            apply4x4(mat, translation4x4, position);
            return {
                primitive,
                id,
                modelMat: mat,
                normalMat: inversetranspose4x4(mat),
            };
        },

        program,

        idProgram,

        dispose: () => {
            program.dispose();
            idProgram.dispose();
            primitive.dispose();
        },
    };
}
