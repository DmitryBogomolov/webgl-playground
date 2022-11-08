import type { Vec2 } from './../geometry/types/vec2';
import type { Vec3 } from './../geometry/types/vec3';
import { VertexData, generateCube, generateSphere } from './figures';

describe('figures', () => {
    function dumpPosition({ x, y, z }: Vec3): string {
        return `(${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)})`;
    }

    function dumpNormal({ x, y, z }: Vec3): string {
        return `(${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)})`;
    }

    function dumpTexcoord({ x, y }: Vec2): string {
        return `(${x.toFixed(2)},${y.toFixed(2)})`;
    }

    function dumpVertex(vertex: VertexData): string {
        const position = dumpPosition(vertex.position);
        const normal = dumpNormal(vertex.normal);
        const texcoord = dumpTexcoord(vertex.texcoord);
        return `${position}|${normal}|${texcoord}`;
    }

    it('generateCube', () => {
        const { vertices, indices } = generateCube({ x: 2, y: 3, z: 4 }, dumpVertex);
        expect(vertices).toEqual([
            '(-1.0,-1.5,2.0)|(0.0,0.0,1.0)|(0.00,0.00)',
            '(1.0,-1.5,2.0)|(0.0,0.0,1.0)|(1.00,0.00)',
            '(1.0,1.5,2.0)|(0.0,0.0,1.0)|(1.00,1.00)',
            '(-1.0,1.5,2.0)|(0.0,0.0,1.0)|(0.00,1.00)',
            '(1.0,-1.5,2.0)|(1.0,0.0,0.0)|(0.00,0.00)',
            '(1.0,-1.5,-2.0)|(1.0,0.0,0.0)|(1.00,0.00)',
            '(1.0,1.5,-2.0)|(1.0,0.0,0.0)|(1.00,1.00)',
            '(1.0,1.5,2.0)|(1.0,0.0,0.0)|(0.00,1.00)',
            '(1.0,-1.5,-2.0)|(0.0,0.0,-1.0)|(0.00,0.00)',
            '(-1.0,-1.5,-2.0)|(0.0,0.0,-1.0)|(1.00,0.00)',
            '(-1.0,1.5,-2.0)|(0.0,0.0,-1.0)|(1.00,1.00)',
            '(1.0,1.5,-2.0)|(0.0,0.0,-1.0)|(0.00,1.00)',
            '(-1.0,-1.5,-2.0)|(-1.0,0.0,0.0)|(0.00,0.00)',
            '(-1.0,-1.5,2.0)|(-1.0,0.0,0.0)|(1.00,0.00)',
            '(-1.0,1.5,2.0)|(-1.0,0.0,0.0)|(1.00,1.00)',
            '(-1.0,1.5,-2.0)|(-1.0,0.0,0.0)|(0.00,1.00)',
            '(-1.0,-1.5,-2.0)|(0.0,-1.0,0.0)|(0.00,0.00)',
            '(1.0,-1.5,-2.0)|(0.0,-1.0,0.0)|(1.00,0.00)',
            '(1.0,-1.5,2.0)|(0.0,-1.0,0.0)|(1.00,1.00)',
            '(-1.0,-1.5,2.0)|(0.0,-1.0,0.0)|(0.00,1.00)',
            '(-1.0,1.5,2.0)|(0.0,1.0,0.0)|(0.00,0.00)',
            '(1.0,1.5,2.0)|(0.0,1.0,0.0)|(1.00,0.00)',
            '(1.0,1.5,-2.0)|(0.0,1.0,0.0)|(1.00,1.00)',
            '(-1.0,1.5,-2.0)|(0.0,1.0,0.0)|(0.00,1.00)',
        ]);
        expect(indices).toEqual([
            0, 1, 2, 2, 3, 0,
            4, 5, 6, 6, 7, 4,
            8, 9, 10, 10, 11, 8,
            12, 13, 14, 14, 15, 12,
            16, 17, 18, 18, 19, 16,
            20, 21, 22, 22, 23, 20,
        ]);
    });

    it('generateSphere', () => {
        const { vertices, indices } = generateSphere({ x: 2, y: 3, z: 4 }, dumpVertex);
        expect(vertices).toEqual([
            '(0.0,1.5,0.0)|(0.0,1.0,0.0)|(0.00,1.00)',
            '(0.0,1.1,1.4)|(0.0,0.8,0.6)|(0.00,0.75)',
            '(0.5,1.1,1.0)|(0.7,0.6,0.3)|(0.13,0.75)',
            '(0.7,1.1,0.0)|(0.8,0.6,0.0)|(0.25,0.75)',
            '(0.5,1.1,-1.0)|(0.7,0.6,-0.3)|(0.38,0.75)',
            '(0.0,1.1,-1.4)|(0.0,0.8,-0.6)|(0.50,0.75)',
            '(-0.5,1.1,-1.0)|(-0.7,0.6,-0.3)|(0.63,0.75)',
            '(-0.7,1.1,-0.0)|(-0.8,0.6,-0.0)|(0.75,0.75)',
            '(-0.5,1.1,1.0)|(-0.7,0.6,0.3)|(0.88,0.75)',
            '(-0.0,1.1,1.4)|(-0.0,0.8,0.6)|(1.00,0.75)',
            '(0.0,0.0,2.0)|(0.0,0.0,1.0)|(0.00,0.50)',
            '(0.7,0.0,1.4)|(0.9,0.0,0.4)|(0.13,0.50)',
            '(1.0,0.0,0.0)|(1.0,0.0,0.0)|(0.25,0.50)',
            '(0.7,0.0,-1.4)|(0.9,0.0,-0.4)|(0.38,0.50)',
            '(0.0,0.0,-2.0)|(0.0,0.0,-1.0)|(0.50,0.50)',
            '(-0.7,0.0,-1.4)|(-0.9,0.0,-0.4)|(0.63,0.50)',
            '(-1.0,0.0,-0.0)|(-1.0,0.0,-0.0)|(0.75,0.50)',
            '(-0.7,0.0,1.4)|(-0.9,0.0,0.4)|(0.88,0.50)',
            '(-0.0,0.0,2.0)|(-0.0,0.0,1.0)|(1.00,0.50)',
            '(0.0,-1.1,1.4)|(0.0,-0.8,0.6)|(0.00,0.25)',
            '(0.5,-1.1,1.0)|(0.7,-0.6,0.3)|(0.13,0.25)',
            '(0.7,-1.1,0.0)|(0.8,-0.6,0.0)|(0.25,0.25)',
            '(0.5,-1.1,-1.0)|(0.7,-0.6,-0.3)|(0.38,0.25)',
            '(0.0,-1.1,-1.4)|(0.0,-0.8,-0.6)|(0.50,0.25)',
            '(-0.5,-1.1,-1.0)|(-0.7,-0.6,-0.3)|(0.63,0.25)',
            '(-0.7,-1.1,-0.0)|(-0.8,-0.6,-0.0)|(0.75,0.25)',
            '(-0.5,-1.1,1.0)|(-0.7,-0.6,0.3)|(0.88,0.25)',
            '(-0.0,-1.1,1.4)|(-0.0,-0.8,0.6)|(1.00,0.25)',
            '(0.0,-1.5,0.0)|(0.0,-1.0,0.0)|(0.00,0.00)',
        ]);
        expect(indices).toEqual([
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 5,
            0, 5, 6,
            0, 6, 7,
            0, 7, 8,
            0, 8, 9,
            1, 10, 11, 11, 2, 1,
            2, 11, 12, 12, 3, 2,
            3, 12, 13, 13, 4, 3,
            4, 13, 14, 14, 5, 4,
            5, 14, 15, 15, 6, 5,
            6, 15, 16, 16, 7, 6,
            7, 16, 17, 17, 8, 7,
            8, 17, 18, 18, 9, 8,
            10, 19, 20, 20, 11, 10,
            11, 20, 21, 21, 12, 11,
            12, 21, 22, 22, 13, 12,
            13, 22, 23, 23, 14, 13,
            14, 23, 24, 24, 15, 14,
            15, 24, 25, 25, 16, 15,
            16, 25, 26, 26, 17, 16,
            17, 26, 27, 27, 18, 17,
            28, 20, 19,
            28, 21, 20,
            28, 22, 21,
            28, 23, 22,
            28, 24, 23,
            28, 25, 24,
            28, 26, 25,
            28, 27, 26,
        ]);
    });
});
