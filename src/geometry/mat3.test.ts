import type { Mat3 } from './mat3.types';
import {
    mat3,
    eq3x3, zero3x3, identity3x3, clone3x3, update3x3, mat3row, mat3col,
    transpose3x3, add3x3, sub3x3, mul3x3, mul3v2, mul3v3,
    det3x3, inverse3x3,
    translation3x3, scaling3x3, rotation3x3,
    projection3x3,
} from './mat3';

describe('mat3', () => {
    const RANK = 3;
    const EPS = 1E-4;

    function make(raw: ArrayLike<number>): Mat3 {
        const ret = mat3();
        for (let i = 0; i < 9; ++i) {
            const row = (i / 3) | 0;
            const col = (i % 3) | 0;
            (ret as number[])[col * 3 + row] = raw[i];
        }
        return ret;
    }

    expect.extend({
        toBeMat3(actual: ArrayLike<number>, expected: ArrayLike<number>) {
            const list: [number, number][] = [];
            for (let i = 0; i < RANK; ++i) {
                for (let j = 0; j < RANK; ++j) {
                    const act = actual[j * RANK + i];
                    const exp = expected[i * RANK + j];
                    if (Math.abs(act - exp) >= EPS) {
                        list.push([i, j]);
                    }
                }
            }
            if (list.length === 0) {
                return {
                    pass: true,
                    message: () => 'OK',
                };
            }
            return {
                pass: false,
                message: () => {
                    const lines: string[] = [];
                    for (const [i, j] of list) {
                        lines.push(`${i},${j}: ${expected[i * RANK + j]} != ${actual[j * RANK + i]}`);
                    }
                    return lines.join('\n');
                },
            };
        },
    });

    it('eq3x3', () => {
        expect(
            eq3x3(
                make([
                    1, 2, 4,
                    3, 4, 5,
                    2, 1, 2,
                ]),
                make([
                    1, 3, 4,
                    3, 1, 5,
                    2, 1, 2,
                ]),
            ),
        ).toEqual(false);
        expect(
            eq3x3(
                make([
                    1, 2, 4,
                    3, 4, 5,
                    2, 1, 2,
                ]),
                make([
                    1, 2, 4,
                    3, 4, 5,
                    2, 1, 2,
                ]),
            ),
        ).toEqual(true);
    });

    it('zero3x3', () => {
        expect(
            zero3x3(),
        ).toBeMat3([
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        ]);
    });

    it('identity3x3', () => {
        expect(
            identity3x3(),
        ).toBeMat3([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]);
    });

    it('clone3x3', () => {
        const raw = [
            1, -2, 1,
            0, 0, 1,
            1, 2, 3,
        ];
        expect(
            clone3x3(make(raw)),
        ).toBeMat3(raw);
    });

    it('update3x3', () => {
        expect(
            update3x3([
                1, -2, 1,
                0, 0, 1,
                1, 2, 3,
            ]),
        ).toBeMat3([
            1, 0, 1,
            -2, 0, 2,
            1, 1, 3,
        ]);
    });

    it('row', () => {
        const mat = make([
            1, 2, 4,
            3, 4, 5,
            2, 1, 2,
        ]);
        expect(
            mat3row(mat, 0),
        ).toBeVec3({ x: 1, y: 2, z: 4 });
        expect(
            mat3row(mat, 1),
        ).toBeVec3({ x: 3, y: 4, z: 5 });
        expect(
            mat3row(mat, 2),
        ).toBeVec3({ x: 2, y: 1, z: 2 });
    });

    it('col', () => {
        const mat = make([
            1, 2, 4,
            3, 4, 5,
            2, 1, 2,
        ]);
        expect(
            mat3col(mat, 0),
        ).toBeVec3({ x: 1, y: 3, z: 2 });
        expect(
            mat3col(mat, 1),
        ).toBeVec3({ x: 2, y: 4, z: 1 });
        expect(
            mat3col(mat, 2),
        ).toBeVec3({ x: 4, y: 5, z: 2 });
    });

    it('transpose3x3', () => {
        expect(
            transpose3x3(
                make([
                    1, 0, 2,
                    -2, 2, 0,
                    3, 1, 2,
                ]),
            ),
        ).toBeMat3([
            1, -2, 3,
            0, 2, 1,
            2, 0, 2,
        ]);
    });

    it('add3x3', () => {
        expect(
            add3x3(
                make([
                    1, 0, -1,
                    3, 0, 3,
                    4, 1, 2,
                ]),
                make([
                    4, 0, -1,
                    3, -2, -1,
                    0, -1, 1,
                ]),
            ),
        ).toBeMat3([
            5, 0, -2,
            6, -2, 2,
            4, 0, 3,
        ]);
    });

    it('sub3x3', () => {
        expect(
            sub3x3(
                make([
                    1, 0, -1,
                    3, 0, 3,
                    4, 1, 2,
                ]),
                make([
                    4, 0, -1,
                    3, -2, -1,
                    0, -1, 1,
                ]),
            ),
        ).toBeMat3([
            -3, 0, 0,
            0, 2, 4,
            4, 2, 1,
        ]);
    });

    it('mul3x3', () => {
        expect(
            mul3x3(
                make([
                    1, 0, -1,
                    3, 0, 3,
                    4, 1, 2,
                ]),
                make([
                    4, 0, -1,
                    3, -2, -1,
                    0, -1, 1,
                ]),
            ),
        ).toBeMat3([
            4, 1, -2,
            12, -3, 0,
            19, -4, -3,
        ]);
    });

    it('mul3v2', () => {
        expect(
            mul3v2(
                make([
                    1, -2, 0,
                    0, 2, -3,
                    0, -1, -1,
                ]),
                { x: 1, y: -2 },
            ),
        ).toEqual({ x: 5, y: -7 });
    });

    it('mul3v3', () => {
        expect(
            mul3v3(
                make([
                    1, -2, 0,
                    0, 2, -3,
                    0, -1, -1,
                ]),
                { x: 1, y: -2, z: 4 },
            ),
        ).toEqual({ x: 5, y: -16, z: -2 });
    });

    it('det3x3', () => {
        expect(
            det3x3(zero3x3()),
        ).toEqual(0);
        expect(
            det3x3(identity3x3()),
        ).toEqual(1);
        expect(
            det3x3(make([
                2, 0, 0,
                0, 3, 0,
                0, 0, 4,
            ])),
        ).toEqual(24);
        expect(
            det3x3(make([
                1, 0, 0,
                0, 0, 1,
                0, 0, 2,
            ])),
        ).toEqual(0);
        expect(
            det3x3(make([
                1, 2, 1,
                3, 0, 1,
                1, 4, 4,
            ])),
        ).toEqual(-14);
    });

    it('inverse3x3', () => {
        expect(
            inverse3x3(zero3x3()),
        ).toBeMat3([
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        ]);
        expect(
            inverse3x3(identity3x3()),
        ).toBeMat3([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]);
        expect(
            inverse3x3(make([
                1, 0, 0,
                0, 2, 0,
                0, 0, 10,
            ])),
        ).toBeMat3([
            1, 0, 0,
            0, 0.5, 0,
            0, 0, 0.1,
        ]);
        expect(
            inverse3x3(make([
                1, 0, 2,
                0, 1, 3,
                0, 0, 1,
            ])),
        ).toBeMat3([
            1, 0, -2,
            0, 1, -3,
            0, 0, 1,
        ]);
    });

    it('translation3x3', () => {
        expect(
            translation3x3({ x: 2, y: 3 }),
        ).toBeMat3([
            1, 0, 2,
            0, 1, 3,
            0, 0, 1,
        ]);
    });

    it('scaling3x3', () => {
        expect(
            scaling3x3({ x: 2, y: 3 }),
        ).toBeMat3([
            2, 0, 0,
            0, 3, 0,
            0, 0, 1,
        ]);
    });

    it('rotation3x3', () => {
        expect(
            rotation3x3(Math.PI / 6),
        ).toBeMat3([
            0.866, -0.5, 0,
            0.5, 0.866, 0,
            0, 0, 1,
        ]);
    });

    it('projection3x3', () => {
        expect(
            projection3x3({
                left: 100, right: 500, bottom: 50, top: 250,
            }),
        ).toBeMat3([
            0.005, 0, -1.5,
            0, 0.01, -1.5,
            0, 0, 1,
        ]);
    });
});
