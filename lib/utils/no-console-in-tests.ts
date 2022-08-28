import { logSilenced } from './logger';
import { Vec2 } from '../geometry/vec2';
import { Vec3 } from '../geometry/vec3';
import { Vec4 } from '../geometry/vec4';
logSilenced(true);

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
const RANK2 = 2;
const RANK3 = 3;
const RANK4 = 4;

expect.extend({
    toBeVec2(actual: Vec2, expected: Vec2) {
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

    toBeVec3(actual: Vec3, expected: Vec3) {
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

    toBeVec4(actual: Vec4, expected: Vec4) {
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

    toBeMat2(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>) {
        const list: [number, number][] = [];
        for (let i = 0; i < RANK2; ++i) {
            for (let j = 0; j < RANK2; ++j) {
                const act = actual[j * RANK2 + i];
                const exp = expected[i * RANK2 + j];
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
                    lines.push(`${i},${j}: ${expected[i * RANK2 + j]} != ${actual[j * RANK2 + i]}`);
                }
                return lines.join('\n');
            },
        };
    },

    toBeMat3(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>) {
        const list: [number, number][] = [];
        for (let i = 0; i < RANK3; ++i) {
            for (let j = 0; j < RANK3; ++j) {
                const act = actual[j * RANK3 + i];
                const exp = expected[i * RANK3 + j];
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
                    lines.push(`${i},${j}: ${expected[i * RANK3 + j]} != ${actual[j * RANK3 + i]}`);
                }
                return lines.join('\n');
            },
        };
    },

    toBeMat4(actual: ReadonlyArray<number>, expected: ReadonlyArray<number>) {
        const list: [number, number][] = [];
        for (let i = 0; i < RANK4; ++i) {
            for (let j = 0; j < RANK4; ++j) {
                const act = actual[j * RANK4 + i];
                const exp = expected[i * RANK4 + j];
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
                    lines.push(`${i},${j}: ${expected[i * RANK4 + j]} != ${actual[j * RANK4 + i]}`);
                }
                return lines.join('\n');
            },
        };
    },
});
