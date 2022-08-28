import { logSilenced } from './lib/utils/logger';
import { Vec2 } from './lib/geometry/vec2';
import { Vec3 } from './lib/geometry/vec3';
import { Vec4 } from './lib/geometry/vec4';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R> {
            toBeVec2(expected: Vec2): CustomMatcherResult;
            toBeVec3(expected: Vec3): CustomMatcherResult;
            toBeVec4(expected: Vec4): CustomMatcherResult;

            toBeMat2(expected: ReadonlyArray<number>): CustomMatcherResult;
            toBeMat3(expected: ReadonlyArray<number>): CustomMatcherResult;
            toBeMat4(expected: ReadonlyArray<number>): CustomMatcherResult;
        }
    }
}

const EPS = 1E-4;
function equal(lhs: number, rhs: number): boolean {
    return Math.abs(lhs - rhs) < EPS;
}

function checkVec<T>(actual: T, expected: T, keys: string[]): jest.CustomMatcherResult {
    // @ts-ignore Vector field.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const checks = keys.map((key) => equal(actual[key], expected[key]));
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
                    const key = keys[i];
                    // @ts-ignore Vector field.
                    lines.push(`${key}: ${expected[key]} != ${actual[key]}`);
                }
            });
            return lines.join('\n');
        },
    };
}

function checkMat(
    actual: ReadonlyArray<number>, expected: ReadonlyArray<number>, rank: number,
): jest.CustomMatcherResult {
    const list: [number, number][] = [];
    for (let i = 0; i < rank; ++i) {
        for (let j = 0; j < rank; ++j) {
            const act = actual[j * rank + i];
            const exp = expected[i * rank + j];
            if (!equal(act, exp)) {
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
                lines.push(`${i},${j}: ${expected[i * rank + j]} != ${actual[j * rank + i]}`);
            }
            return lines.join('\n');
        },
    };
}

expect.extend({
    toBeVec2(actual: Vec2, expected: Vec2) {
        return checkVec(actual, expected, ['x', 'y']);
    },

    toBeVec3(actual: Vec3, expected: Vec3) {
        return checkVec(actual, expected, ['x', 'y', 'z']);
    },

    toBeVec4(actual: Vec4, expected: Vec4) {
        return checkVec(actual, expected, ['x', 'y', 'z', 'w']);
    },

    toBeMat2(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>) {
        return checkMat(actual, expected, 2);
    },

    toBeMat3(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>) {
        return checkMat(actual, expected, 3);
    },

    toBeMat4(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>) {
        return checkMat(actual, expected, 4);
    },
});

logSilenced(true);
