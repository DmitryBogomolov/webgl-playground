import type { Vec2 } from '../lib/geometry/vec2.types';
import type { Vec3 } from '../lib/geometry/vec3.types';
import type { Vec4 } from '../lib/geometry/vec4.types';
import type { Mat2 } from '../lib/geometry/mat2.types';
import type { Mat3 } from '../lib/geometry/mat3.types';
import type { Mat4 } from '../lib/geometry/mat4.types';
import type { Spherical } from '../lib/geometry/spherical.types';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R> {
            toBeVec2(expected: Vec2): CustomMatcherResult;
            toBeVec3(expected: Vec3): CustomMatcherResult;
            toBeVec4(expected: Vec4): CustomMatcherResult;

            toBeMat2(expected: Mat2): CustomMatcherResult;
            toBeMat3(expected: Mat3): CustomMatcherResult;
            toBeMat4(expected: Mat4): CustomMatcherResult;

            toBeSpherical(expected: Spherical): CustomMatcherResult;
        }

        interface Expect {
            numArray(expected: ReadonlyArray<number>): ReadonlyArray<number>;
        }
    }
}

const EPS = 1E-4;
function equal(lhs: number, rhs: number): boolean {
    return Math.abs(lhs - rhs) < EPS;
}

function vecToStr(v: unknown, keys: ReadonlyArray<string>): string {
    // @ts-ignore Vector field.
    const parts = keys.map((key) => `${key}: ${v[key]}`);
    return `{ ${parts.join(', ')} }`;
}

function checkVec<T>(actual: T, expected: T, keys: ReadonlyArray<string>): jest.CustomMatcherResult {
    // @ts-ignore Vector field.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const eq = keys.every((key) => equal(actual[key], expected[key]));
    if (eq) {
        return {
            pass: true,
            message: () => 'OK',
        };
    }
    return {
        pass: false,
        message: () => {
            const actualStr = vecToStr(actual, keys);
            const expectedStr = vecToStr(expected, keys);
            return `${actualStr} != ${expectedStr}`;
        },
    };
}

function matToStr(v: unknown, rank: number, transpose: boolean): string {
    const elements = v as ReadonlyArray<number>;
    const lines: string[] = [];
    for (let i = 0; i < rank; ++i) {
        const parts: string[] = [];
        for (let j = 0; j < rank; ++j) {
            const idx = transpose ? j * rank + i : i * rank + j;
            parts.push(String(elements[idx]));
        }
        lines.push(parts.join(' '));
    }
    return lines.join('\n');
}

function checkMat<T extends { readonly [i: number]: number }>(
    actual: T, expected: T, rank: number,
): jest.CustomMatcherResult {
    let count = 0;
    for (let i = 0; i < rank; ++i) {
        for (let j = 0; j < rank; ++j) {
            if (!equal(actual[j * rank + i], expected[i * rank + j])) {
                ++count;
            }
        }
    }
    if (count === 0) {
        return {
            pass: true,
            message: () => 'OK',
        };
    }
    return {
        pass: false,
        message: () => {
            const actualStr = matToStr(actual, rank, true);
            const expectedStr = matToStr(expected, rank, false);
            return `${actualStr}\n!=\n${expectedStr}`;
        },
    };
}

expect.extend({
    toBeVec2(actual: Vec2, expected: Vec2): jest.CustomMatcherResult {
        return checkVec(actual, expected, ['x', 'y']);
    },

    toBeVec3(actual: Vec3, expected: Vec3): jest.CustomMatcherResult {
        return checkVec(actual, expected, ['x', 'y', 'z']);
    },

    toBeVec4(actual: Vec4, expected: Vec4): jest.CustomMatcherResult {
        return checkVec(actual, expected, ['x', 'y', 'z', 'w']);
    },

    toBeMat2(actual: Mat2, expected: Mat2): jest.CustomMatcherResult {
        return checkMat(actual, expected, 2);
    },

    toBeMat3(actual: Mat3, expected: Mat3): jest.CustomMatcherResult {
        return checkMat(actual, expected, 3);
    },

    toBeMat4(actual: Mat4, expected: Mat4): jest.CustomMatcherResult {
        return checkMat(actual, expected, 4);
    },

    toBeSpherical(actual: Spherical, expected: Spherical): jest.CustomMatcherResult {
        const eq = equal(actual.azimuth, expected.azimuth) && equal(actual.elevation, expected.elevation);
        if (eq) {
            return {
                pass: true,
                message: () => 'OK',
            };
        }
        return {
            pass: false,
            message: () => {
                const actualStr = vecToStr(actual, ['azimuth', 'elevation']);
                const expectedStr = vecToStr(expected, ['azimuth', 'elevation']);
                return `${actualStr} != ${expectedStr}`;
            },
        };
    },

    numArray(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>): jest.CustomMatcherResult {
        const eq = actual.length === expected.length && expected.every((exp, i) => equal(exp, actual[i]));
        if (eq) {
            return {
                pass: true,
                message: () => 'OK',
            };
        }
        return {
            pass: false,
            message: () => 'NOT OK',
        };
    },
});
