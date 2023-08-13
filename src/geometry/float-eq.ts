export const FLOAT_EQ_EPS = 1E-7;

export function floatEq(a: number, b: number, eps: number = FLOAT_EQ_EPS): boolean {
    return Math.abs(a - b) <= eps;
}
