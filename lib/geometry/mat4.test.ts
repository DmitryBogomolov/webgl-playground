import { zero4x4, identity4x4, update4x4, det4x4, inverse4x4 } from './mat4';

const EPS = 1E-7;

expect.extend({
    toBeMat(actual, expected) {
        const list: [number, number][] = [];
        for (let i = 0; i < 4; ++i) {
            for (let j = 0; j < 4; ++j) {
                const act = actual[j * 4 + i];
                const exp = expected[i * 4 + j];
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
                    lines.push(`${i},${j}: ${expected[i * 4 + j]} != ${actual[j * 4 + i]}`);
                }
                return lines.join('\n');
            },
        };
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeMat(expected: number[]): CustomMatcherResult;
        }
    }
}

describe('mat4', () => {
    it('det4x4', () => {
        expect(
            det4x4(zero4x4()),
        ).toEqual(0);
        expect(
            det4x4(identity4x4()),
        ).toEqual(1);
        expect(
            det4x4(update4x4([
                2, 0, 0, 0,
                0, 3, 0, 0,
                0, 0, 4, 0,
                0, 0, 0, 5,
            ])),
        ).toEqual(120);
        expect(
            det4x4(update4x4([
                1, 0, 0, 0,
                0, 0, 1, 0,
                0, 0, 2, 0,
                0, 0, 0, 1,
            ])),
        ).toEqual(0);
        expect(
            det4x4(update4x4([
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
        ).toBeMat([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]);
        expect(
            inverse4x4(identity4x4()),
        ).toBeMat([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
        expect(
            inverse4x4(update4x4([
                1, 0, 0, 0,
                0, 2, 0, 0,
                0, 0, 10, 0,
                0, 0, 0, 0.25,
            ])),
        ).toBeMat([
            1, 0, 0, 0,
            0, 0.5, 0, 0,
            0, 0, 0.1, 0,
            0, 0, 0, 4,
        ]);
        expect(
            inverse4x4(update4x4([
                1, 0, 0, 2,
                0, 1, 0, 3,
                0, 0, 1, 4,
                0, 0, 0, 1,
            ])),
        ).toBeMat([
            1, 0, 0, -2,
            0, 1, 0, -3,
            0, 0, 1, -4,
            0, 0, 0, 1,
        ]);
    });
});
