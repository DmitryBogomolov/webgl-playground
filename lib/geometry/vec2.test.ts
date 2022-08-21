import {
    Vec2,
    ZERO2, UNIT2, XUNIT2, YUNIT2,
    eq2, neg2, inv2, len2, sqrlen2, norm2,
    dot2, mul2, add2, sub2,
} from './vec2';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R> {
            toBeVec(expected: Vec2): CustomMatcherResult;
        }
    }
}

describe('vec2', () => {
    const EPS = 1E-4;

    expect.extend({
        toBeVec(actual: Vec2, expected: Vec2) {
            const keys = ['x', 'y'];
            const checks = keys.map((key) => {
                return Math.abs(actual[key as keyof Vec2] - expected[key as keyof Vec2]) < EPS;
            });
            if (checks.every(Boolean)) {
                return {
                    pass: true,
                    message: () => 'OK',
                };
            }
            return {
                pass: false,
                message: () => {
                    const lines: string[] = [];
                    checks.forEach((check, i) => {
                        if (!check) {
                            const key = keys[i] as keyof Vec2;
                            lines.push(`${key}: ${expected[key]} != ${actual[key]}`);
                        }
                    });
                    return lines.join('\n');
                },
            };
        },
    });

    it('constants', () => {
        expect(eq2(ZERO2, { x: 0, y: 0 })).toEqual(true);
        expect(eq2(UNIT2, { x: 1, y: 1 })).toEqual(true);
        expect(eq2(XUNIT2, { x: 1, y: 0 })).toEqual(true);
        expect(eq2(YUNIT2, { x: 0, y: 1 })).toEqual(true);
    });

    it('eq2', () => {
        expect(eq2({ x: 1, y: 2 }, { x: 2, y: 3 })).toEqual(false);
        expect(eq2({ x: 1, y: 2 }, { x: 1, y: 2 })).toEqual(true);
    });

    it('dot2', () => {
        expect(dot2({ x: 1, y: 2 }, { x: 2, y: 3 })).toEqual(8);
    });

    it('neg2', () => {
        expect(neg2({ x: 1, y: 2 })).toBeVec({ x: -1, y: -2 });
    });

    it('inv2', () => {
        expect(inv2({ x: 1, y: 2 })).toBeVec({ x: 1, y: 0.5 });
    });

    it('mul2', () => {
        expect(mul2({ x: 1, y: 2 }, 4)).toBeVec({ x: 4, y: 8 });
    });

    it('add2', () => {
        expect(add2({ x: 1, y: 2 }, { x: 2, y: 4 })).toBeVec({ x: 3, y: 6 });
    });

    it('sub2', () => {
        expect(sub2({ x: 1, y: 2 }, { x: 2, y: 4 })).toBeVec({ x: -1, y: -2 });
    });

    it('len2', () => {
        expect(len2({ x: 1, y: 2 })).toBeCloseTo(2.2361, 4);
    });

    it('sqrlen2', () => {
        expect(sqrlen2({ x: 1, y: 2 })).toEqual(5);
    });

    it('norm2', () => {
        expect(norm2({ x: 3, y: 4 })).toBeVec({ x: 0.6, y: 0.8 });
    });
});
