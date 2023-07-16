import { getNodeTransform } from './node';

describe('node', () => {
    describe('getNodeTransform', () => {
        it('return null when no data', () => {
            expect(getNodeTransform({})).toEqual(null);
        });

        it('return matrix from "matrix" field', () => {
            expect(
                getNodeTransform({
                    matrix: [
                        11, 21, 31, 41,
                        12, 22, 32, 42,
                        13, 23, 33, 43,
                        14, 24, 34, 44,
                    ],
                }),
            ).toBeMat4([
                11, 12, 13, 14,
                21, 22, 23, 24,
                31, 32, 33, 34,
                41, 42, 43, 44,
            ]);
        });

        it('make matrix from scale', () => {
            expect(
                getNodeTransform({
                    scale: [2, 3, 4],
                }),
            ).toBeMat4([
                2, 0, 0, 0,
                0, 3, 0, 0,
                0, 0, 4, 0,
                0, 0, 0, 1,
            ]);
        });

        it('make matrix from rotation', () => {
            expect(
                getNodeTransform({
                    rotation: [Math.cos(Math.PI / 4), 0, 0, Math.sin(Math.PI / 4)],
                }),
            ).toBeMat4([
                1, 0, 0, 0,
                0, 0, -1, 0,
                0, 1, 0, 0,
                0, 0, 0, 1,
            ]);
        });

        it('make matrix from translation', () => {
            expect(
                getNodeTransform({
                    translation: [20, 30, 40],
                }),
            ).toBeMat4([
                1, 0, 0, 20,
                0, 1, 0, 30,
                0, 0, 1, 40,
                0, 0, 0, 1,
            ]);
        });

        it('make matrix from scale, rotation, translation', () => {
            expect(
                getNodeTransform({
                    scale: [2, 3, 4],
                    rotation: [Math.cos(Math.PI / 4), 0, 0, Math.sin(Math.PI / 4)],
                    translation: [20, 30, 40],
                }),
            ).toBeMat4([
                2, 0, 0, 20,
                0, 0, -4, 30,
                0, 3, 0, 40,
                0, 0, 0, 1,
            ]);
        });
    });
});
