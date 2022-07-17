import {
    Vec3,
    ZERO3, UNIT3, XUNIT3, YUNIT3, ZUNIT3,
    eq3, neg3, len3, sqrlen3, norm3,
    dot3, mul3, add3, sub3, cross3,
} from './vec3';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R> {
            toBeVec(expected: Vec3): CustomMatcherResult;
        }
    }
}

describe('vec3', () => {
    const EPS = 1E-4;

    expect.extend({
        toBeVec(actual: Vec3, expected: Vec3) {
            const keys = ['x', 'y', 'z'];
            const checks = keys.map((key) => {
                return Math.abs(actual[key as keyof Vec3] - expected[key as keyof Vec3]) < EPS;
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
                            const key = keys[i] as keyof Vec3;
                            lines.push(`${key}: ${expected[key]} != ${actual[key]}`);
                        }
                    });
                    return lines.join('\n');
                },
            };
        },
    });

    it('constants', () => {
        expect(eq3(ZERO3, { x: 0, y: 0, z: 0 })).toEqual(true);
        expect(eq3(UNIT3, { x: 1, y: 1, z: 1 })).toEqual(true);
        expect(eq3(XUNIT3, { x: 1, y: 0, z: 0 })).toEqual(true);
        expect(eq3(YUNIT3, { x: 0, y: 1, z: 0 })).toEqual(true);
        expect(eq3(ZUNIT3, { x: 0, y: 0, z: 1 })).toEqual(true);
    });

    it('eq3', () => {
        expect(eq3({ x: 1, y: 2, z: 3 }, { x: 2, y: 3, z: 4 })).toEqual(false);
        expect(eq3({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })).toEqual(true);
    });

    it('dot3', () => {
        expect(dot3({ x: 1, y: 2, z: 3 }, { x: 2, y: 3, z: -1 })).toEqual(5);
    });

    it('neg3', () => {
        expect(neg3({ x: 1, y: 2, z: 3 })).toBeVec({ x: -1, y: -2, z: -3 });
    });

    it('mul3', () => {
        expect(mul3({ x: 1, y: 2, z: 3 }, 4)).toBeVec({ x: 4, y: 8, z: 12 });
    });

    it('add3', () => {
        expect(add3({ x: 1, y: 2, z: 3 }, { x: 2, y: 4, z: 6 })).toBeVec({ x: 3, y: 6, z: 9 });
    });

    it('sub3', () => {
        expect(sub3({ x: 1, y: 2, z: 3 }, { x: 2, y: 4, z: 6 })).toBeVec({ x: -1, y: -2, z: -3 });
    });

    it('len3', () => {
        expect(len3({ x: 1, y: 2, z: 3 })).toBeCloseTo(3.7417, 4);
    });

    it('sqrlen3', () => {
        expect(sqrlen3({ x: 1, y: 2, z: 3 })).toEqual(14);
    });

    it('norm3', () => {
        expect(norm3({ x: 3, y: 4, z: 5 })).toBeVec({ x: 0.4243, y: 0.5657, z: 0.7071 });
    });

    it('cross3', () => {
        expect(cross3({ x: 1, y: 2, z: 3 }, { x: 2, y: -1, z: -2 })).toBeVec({ x: -1, y: 8, z: -5 });
    });
});