import type { Mat4 } from './mat4.types';
import {
    mat4,
    eq4x4, zero4x4, identity4x4, clone4x4, update4x4, transpose4x4,
    add4x4, sub4x4, mul4x4, mul4v3, mul4v4,
    det4x4, inverse4x4, inversetranspose4x4,
    translation4x4, scaling4x4, rotation4x4, xrotation4x4, yrotation4x4, zrotation4x4,
    orthographic4x4, perspective4x4, frustum4x4, lookAt4x4, targetTo4x4,
} from './mat4';

describe('mat4', () => {
    function make(raw: ReadonlyArray<number>): Mat4 {
        const ret = mat4();
        for (let i = 0; i < 16; ++i) {
            const row = (i / 4) | 0;
            const col = i % 4;
            (ret as number[])[col * 4 + row] = raw[i];
        }
        return ret;
    }

    it('eq4x4', () => {
        expect(
            eq4x4(
                make([
                    1, 2, 4, 1,
                    3, 4, 5, 2,
                    2, 1, 2, 3,
                    1, 2, 3, 4,
                ]),
                make([
                    1, 3, 4, 1,
                    3, 1, 5, 2,
                    2, 1, 2, 3,
                    1, 2, 3, 4,
                ]),
            ),
        ).toEqual(false);
        expect(
            eq4x4(
                make([
                    1, 2, 4, 1,
                    3, 4, 5, 2,
                    2, 1, 2, 3,
                    1, 2, 3, 4,
                ]),
                make([
                    1, 2, 4, 1,
                    3, 4, 5, 2,
                    2, 1, 2, 3,
                    1, 2, 3, 4,
                ]),
            ),
        ).toEqual(true);
    });

    it('zero4x4', () => {
        expect(
            zero4x4(),
        ).toBeMat4([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]);
    });

    it('identity4x4', () => {
        expect(
            identity4x4(),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    });

    it('clone4x4', () => {
        const raw = [
            1, -2, 1, -1,
            0, 0, 1, 1,
            1, 2, 3, 4,
            1, 2, 1, 3,
        ];
        expect(
            clone4x4(make(raw)),
        ).toBeMat4(raw);
    });

    it('update4x4', () => {
        expect(
            update4x4([
                1, -2, 1, -1,
                0, 0, 1, 1,
                1, 2, 3, 4,
                1, 2, 1, 3,
            ]),
        ).toBeMat4([
            1, 0, 1, 1,
            -2, 0, 2, 2,
            1, 1, 3, 1,
            -1, 1, 4, 3,
        ]);
    });

    it('transpose4x4', () => {
        expect(
            transpose4x4(make([
                1, 0, 2, 3,
                -2, 2, 0, -1,
                3, 1, 2, -4,
                0, 1, 4, 2,
            ])),
        ).toBeMat4([
            1, -2, 3, 0,
            0, 2, 1, 1,
            2, 0, 2, 4,
            3, -1, -4, 2,
        ]);
    });

    it('add4x4', () => {
        expect(
            add4x4(
                make([
                    1, 0, -1, -2,
                    3, 0, 3, -1,
                    4, 1, 2, 4,
                    -4, -2, 0, 0,
                ]),
                make([
                    4, 0, -1, -1,
                    3, -2, -1, 0,
                    0, -1, 1, 1,
                    4, 2, -2, -2,
                ]),
            ),
        ).toBeMat4([
            5, 0, -2, -3,
            6, -2, 2, -1,
            4, 0, 3, 5,
            0, 0, -2, -2,
        ]);
    });

    it('sub4x4', () => {
        expect(
            sub4x4(
                make([
                    1, 0, -1, -2,
                    3, 0, 3, -1,
                    4, 1, 2, 4,
                    -4, -2, 0, 0,
                ]),
                make([
                    4, 0, -1, -1,
                    3, -2, -1, 0,
                    0, -1, 1, 1,
                    4, 2, -2, -2,
                ]),
            ),
        ).toBeMat4([
            -3, 0, 0, -1,
            0, 2, 4, -1,
            4, 2, 1, 3,
            -8, -4, 2, 2,
        ]);
    });

    it('mul4x4', () => {
        expect(
            mul4x4(
                make([
                    1, 0, -1, -2,
                    3, 0, 3, -1,
                    4, 1, 2, 4,
                    -4, -2, 0, 0,
                ]),
                make([
                    4, 0, -1, -1,
                    3, -2, -1, 0,
                    0, -1, 1, 1,
                    4, 2, -2, -2,
                ]),
            ),
        ).toBeMat4([
            -4, -3, 2, 2,
            8, -5, 2, 2,
            35, 4, -11, -10,
            -22, 4, 6, 4,
        ]);
    });

    it('mul4v3', () => {
        expect(
            mul4v3(
                make([
                    1, -2, 0, 1,
                    0, 2, -3, 1,
                    0, -1, -1, 0,
                    1, 1, 2, -2,
                ]),
                { x: 1, y: -2, z: 4 },
            ),
        ).toEqual({ x: 1.2, y: -3, z: -0.4 });
    });

    it('mul4v4', () => {
        expect(
            mul4v4(
                make([
                    1, -2, 0, 1,
                    0, 2, -3, 1,
                    0, -1, -1, 0,
                    1, 1, 2, -2,
                ]),
                { x: 1, y: -2, z: 4, w: 2 },
            ),
        ).toEqual({ x: 7, y: -14, z: -2, w: 3 });
    });

    it('det4x4', () => {
        expect(
            det4x4(zero4x4()),
        ).toEqual(0);
        expect(
            det4x4(identity4x4()),
        ).toEqual(1);
        expect(
            det4x4(make([
                2, 0, 0, 0,
                0, 3, 0, 0,
                0, 0, 4, 0,
                0, 0, 0, 5,
            ])),
        ).toEqual(120);
        expect(
            det4x4(make([
                1, 0, 0, 0,
                0, 0, 1, 0,
                0, 0, 2, 0,
                0, 0, 0, 1,
            ])),
        ).toEqual(0);
        expect(
            det4x4(make([
                1, 2, 1, 2,
                3, 0, 1, 0,
                1, 4, 4, 0,
                1, 2, 1, 1,
            ])),
        ).toEqual(14);
    });

    it('inverse4x4', () => {
        expect(
            inverse4x4(zero4x4()),
        ).toBeMat4([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]);
        expect(
            inverse4x4(identity4x4()),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
        expect(
            inverse4x4(make([
                1, 0, 0, 0,
                0, 2, 0, 0,
                0, 0, 10, 0,
                0, 0, 0, 0.25,
            ])),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 0.5, 0, 0,
            0, 0, 0.1, 0,
            0, 0, 0, 4,
        ]);
        expect(
            inverse4x4(make([
                1, 0, 0, 2,
                0, 1, 0, 3,
                0, 0, 1, 4,
                0, 0, 0, 1,
            ])),
        ).toBeMat4([
            1, 0, 0, -2,
            0, 1, 0, -3,
            0, 0, 1, -4,
            0, 0, 0, 1,
        ]);
    });

    it('inversetranspose4x4', () => {
        expect(
            inversetranspose4x4(zero4x4()),
        ).toBeMat4([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]);
        expect(
            inversetranspose4x4(identity4x4()),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
        expect(
            inversetranspose4x4(make([
                1, 0, 0, 0,
                0, 2, 0, 0,
                0, 0, 10, 0,
                0, 0, 0, 0.25,
            ])),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 0.5, 0, 0,
            0, 0, 0.1, 0,
            0, 0, 0, 4,
        ]);
        expect(
            inversetranspose4x4(make([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                2, 3, 4, 1,
            ])),
        ).toBeMat4([
            1, 0, 0, -2,
            0, 1, 0, -3,
            0, 0, 1, -4,
            0, 0, 0, 1,
        ]);
    });

    it('translation4x4', () => {
        expect(
            translation4x4({ x: 2, y: 3, z: 4 }),
        ).toBeMat4([
            1, 0, 0, 2,
            0, 1, 0, 3,
            0, 0, 1, 4,
            0, 0, 0, 1,
        ]);
    });

    it('scaling4x4', () => {
        expect(
            scaling4x4({ x: 2, y: 3, z: 4 }),
        ).toBeMat4([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 1,
        ]);
    });

    it('rotation4x4', () => {
        expect(
            rotation4x4({ x: 1, y: 1, z: 1 }, Math.PI / 6),
        ).toBeMat4([
            0.9107, -0.244, 0.3333, 0,
            0.3333, 0.9107, -0.244, 0,
            -0.244, 0.3333, 0.9107, 0,
            0, 0, 0, 1,
        ]);
    });

    it('xrotation4x4', () => {
        expect(
            xrotation4x4(Math.PI / 6),
        ).toBeMat4(
            transpose4x4(rotation4x4({ x: 1, y: 0, z: 0 }, Math.PI / 6)) as number[],
        );
    });

    it('xrotation4x4', () => {
        expect(
            xrotation4x4(Math.PI / 6),
        ).toBeMat4(
            transpose4x4(rotation4x4({ x: 1, y: 0, z: 0 }, Math.PI / 6)) as number[],
        );
    });

    it('yrotation4x4', () => {
        expect(
            yrotation4x4(Math.PI / 6),
        ).toBeMat4(
            transpose4x4(rotation4x4({ x: 0, y: 1, z: 0 }, Math.PI / 6)) as number[],
        );
    });

    it('zrotation4x4', () => {
        expect(
            zrotation4x4(Math.PI / 6),
        ).toBeMat4(
            transpose4x4(rotation4x4({ x: 0, y: 0, z: 1 }, Math.PI / 6)) as number[],
        );
    });

    it('orthographic4x4', () => {
        expect(
            orthographic4x4({
                left: 100, right: 500, bottom: 50, top: 250, zNear: 1, zFar: 100,
            }),
        ).toBeMat4([
            0.005, 0, 0, -1.5,
            0, 0.01, 0, -1.5,
            0, 0, -0.0202, -1.0202,
            0, 0, 0, 1,
        ]);
    });

    it('perspective4x4', () => {
        expect(
            perspective4x4({
                aspect: 2,
                yFov: Math.PI / 4,
                zNear: 0.1,
                zFar: 100,
            }),
        ).toBeMat4([
            1.2071, 0, 0, 0,
            0, 2.4142, 0, 0,
            0, 0, -1.002, -0.2002,
            0, 0, -1, 0,
        ]);
    });

    it('frustum4x4', () => {
        expect(
            frustum4x4({
                left: -3,
                right: +5,
                bottom: -1,
                top: +2,
                zNear: 0.1,
                zFar: 100,
            }),
        ).toBeMat4([
            0.025, 0, 0.25, 0,
            0, 0.0667, 0.3333, 0,
            0, 0, -1.002, -0.2002,
            0, 0, -1, 0,
        ]);
    });

    it('lookAt4x4', () => {
        expect(
            lookAt4x4({
                eye: { x: 0, y: 0, z: 5 },
                center: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 2, z: 0 },
            }),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, -5,
            0, 0, 0, 1,
        ]);
    });

    it('targetTo4x4', () => {
        expect(
            targetTo4x4({
                eye: { x: 0, y: 0, z: 5 },
                target: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 2, z: 0 },
            }),
        ).toBeMat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 5,
            0, 0, 0, 1,
        ]);
    });
});
