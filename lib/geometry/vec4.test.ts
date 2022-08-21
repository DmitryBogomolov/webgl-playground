import {
    Vec4,
    ZERO4, UNIT4, XUNIT4, YUNIT4, ZUNIT4, WUNIT4,
    eq4, neg4, inv4, len4, sqrlen4, norm4,
    dot4, mul4, add4, sub4,
} from './vec4';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R> {
            toBeVec(expected: Vec4): CustomMatcherResult;
        }
    }
}

describe('vec4', () => {
    const EPS = 1E-4;

    expect.extend({
        toBeVec(actual: Vec4, expected: Vec4) {
            const keys = ['x', 'y', 'z', 'w'];
            const checks = keys.map((key) => {
                return Math.abs(actual[key as keyof Vec4] - expected[key as keyof Vec4]) < EPS;
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
                            const key = keys[i] as keyof Vec4;
                            lines.push(`${key}: ${expected[key]} != ${actual[key]}`);
                        }
                    });
                    return lines.join('\n');
                },
            };
        },
    });

    it('constants', () => {
        expect(eq4(ZERO4, { x: 0, y: 0, z: 0, w: 0 })).toEqual(true);
        expect(eq4(UNIT4, { x: 1, y: 1, z: 1, w: 1 })).toEqual(true);
        expect(eq4(XUNIT4, { x: 1, y: 0, z: 0, w: 0 })).toEqual(true);
        expect(eq4(YUNIT4, { x: 0, y: 1, z: 0, w: 0 })).toEqual(true);
        expect(eq4(ZUNIT4, { x: 0, y: 0, z: 1, w: 0 })).toEqual(true);
        expect(eq4(WUNIT4, { x: 0, y: 0, z: 0, w: 1 })).toEqual(true);
    });

    it('eq4', () => {
        expect(eq4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 3, z: 4, w: 5 })).toEqual(false);
        expect(eq4({ x: 1, y: 2, z: 3, w: 4 }, { x: 1, y: 2, z: 3, w: 4 })).toEqual(true);
    });

    it('dot4', () => {
        expect(dot4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 3, z: -1, w: -2 })).toEqual(-3);
    });

    it('neg4', () => {
        expect(neg4({ x: 1, y: 2, z: 3, w: 4 })).toBeVec({ x: -1, y: -2, z: -3, w: -4 });
    });

    it('inv4', () => {
        expect(inv4({ x: 1, y: 2, z: 3, w: 4 })).toBeVec({ x: 1, y: 0.5, z: 0.3333, w: 0.25 });
    });

    it('mul4', () => {
        expect(mul4({ x: 1, y: 2, z: 3, w: 4 }, 4)).toBeVec({ x: 4, y: 8, z: 12, w: 16 });
    });

    it('add4', () => {
        expect(add4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 4, z: 6, w: 8 })).toBeVec({ x: 3, y: 6, z: 9, w: 12 });
    });

    it('sub4', () => {
        expect(sub4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 4, z: 6, w: 8 })).toBeVec({ x: -1, y: -2, z: -3, w: -4 });
    });

    it('len4', () => {
        expect(len4({ x: 1, y: 2, z: 3, w: 4 })).toBeCloseTo(5.4772, 4);
    });

    it('sqrlen4', () => {
        expect(sqrlen4({ x: 1, y: 2, z: 3, w: 4 })).toEqual(30);
    });

    it('norm4', () => {
        expect(norm4({ x: 3, y: 4, z: 5, w: 6 })).toBeVec({ x: 0.3235, y: 0.4313, z: 0.5392, w: 0.647 });
    });
});
