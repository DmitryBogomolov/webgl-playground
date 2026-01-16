import type { Mat2 } from './mat2.types';
import {
    mat2,
    eq2x2, zero2x2, identity2x2, clone2x2, update2x2, mat2row, mat2col,
    transpose2x2, add2x2, sub2x2, mul2x2, mul2v2,
    det2x2, inverse2x2,
} from './mat2';

describe('mat2', () => {
    function make(raw: ReadonlyArray<number>): Mat2 {
        const ret = mat2();
        for (let i = 0; i < 4; ++i) {
            const row = (i / 2) | 0;
            const col = i % 2;
            (ret as number[])[col * 2 + row] = raw[i];
        }
        return ret;
    }

    it('eq2x2', () => {
        expect(
            eq2x2(
                make([
                    1, 2,
                    3, 4,
                ]),
                make([
                    1, 3,
                    3, 1,
                ]),
            ),
        ).toEqual(false);
        expect(
            eq2x2(
                make([
                    1, 2,
                    3, 4,
                ]),
                make([
                    1, 2,
                    3, 4,
                ]),
            ),
        ).toEqual(true);
    });

    it('zero2x2', () => {
        expect(
            zero2x2(),
        ).toBeMat2([
            0, 0,
            0, 0,
        ]);
    });

    it('identity2x2', () => {
        expect(
            identity2x2(),
        ).toBeMat2([
            1, 0,
            0, 1,
        ]);
    });

    it('clone2x2', () => {
        const raw = [
            1, -2,
            3, 0,
        ];
        expect(
            clone2x2(make(raw)),
        ).toBeMat2(raw);
    });

    it('update2x2', () => {
        expect(
            update2x2([
                1, -2,
                0, 0,
            ]),
        ).toBeMat2([
            1, 0,
            -2, 0,
        ]);
    });

    it('row', () => {
        const mat = make([
            1, 2,
            3, 4,
        ]);
        expect(
            mat2row(mat, 0),
        ).toBeVec2({ x: 1, y: 2 });
        expect(
            mat2row(mat, 1),
        ).toBeVec2({ x: 3, y: 4 });
    });

    it('col', () => {
        const mat = make([
            1, 2,
            3, 4,
        ]);
        expect(
            mat2col(mat, 0),
        ).toBeVec2({ x: 1, y: 3 });
        expect(
            mat2col(mat, 1),
        ).toBeVec2({ x: 2, y: 4 });
    });

    it('transpose2x2', () => {
        expect(
            transpose2x2(make([
                1, 0,
                -2, 2,
            ])),
        ).toBeMat2([
            1, -2,
            0, 2,
        ]);
    });

    it('add2x2', () => {
        expect(
            add2x2(
                make([
                    1, 0,
                    3, 0,
                ]),
                make([
                    4, 0,
                    3, -2,
                ]),
            ),
        ).toBeMat2([
            5, 0,
            6, -2,
        ]);
    });

    it('sub2x2', () => {
        expect(
            sub2x2(
                make([
                    1, 0,
                    3, 0,
                ]),
                make([
                    4, 0,
                    3, -2,
                ]),
            ),
        ).toBeMat2([
            -3, 0,
            0, 2,
        ]);
    });

    it('mul2x2', () => {
        expect(
            mul2x2(
                make([
                    1, 2,
                    3, 0,
                ]),
                make([
                    4, 0,
                    3, -2,
                ]),
            ),
        ).toBeMat2([
            10, -4,
            12, 0,
        ]);
    });

    it('mul2v2', () => {
        expect(
            mul2v2(
                make([
                    1, -2,
                    -3, 2,
                ]),
                { x: 1, y: -2 },
            ),
        ).toEqual({ x: 5, y: -7 });
    });

    it('det2x2', () => {
        expect(
            det2x2(zero2x2()),
        ).toEqual(0);
        expect(
            det2x2(identity2x2()),
        ).toEqual(1);
        expect(
            det2x2(make([
                2, 0,
                0, 3,
            ])),
        ).toEqual(6);
        expect(
            det2x2(make([
                1, 1,
                0, 0,
            ])),
        ).toEqual(0);
        expect(
            det2x2(make([
                1, 2,
                3, 4,
            ])),
        ).toEqual(-2);
    });

    it('inverse2x2', () => {
        expect(
            inverse2x2(zero2x2()),
        ).toBeMat2([
            0, 0,
            0, 0,
        ]);
        expect(
            inverse2x2(identity2x2()),
        ).toBeMat2([
            1, 0,
            0, 1,
        ]);
        expect(
            inverse2x2(make([
                1, 0,
                0, 2,
            ])),
        ).toBeMat2([
            1, 0,
            0, 0.5,
        ]);
        expect(
            inverse2x2(make([
                1, 2,
                3, 4,
            ])),
        ).toBeMat2([
            -2, 1,
            1.5, -0.5,
        ]);
    });
});
