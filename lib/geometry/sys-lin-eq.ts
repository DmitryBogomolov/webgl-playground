export function solveSysLinEq(
    [a11, a12, a21, a22]: Readonly<[number, number, number, number]>,
    [b1, b2]: Readonly<[number, number]>,
): [number, number] | undefined | null {
    const det = a11 * a22 - a21 * a12;
    const det1 = b1 * a22 - b2 * a12;
    const det2 = a11 * b2 - a21 * b1;
    const x = det1 / det;
    const y = det2 / det;
    if (Number.isFinite(x) && Number.isFinite(y)) {
        return [x, y];
    }
    return det1 === 0 && det2 === 0 ? undefined : null;
}
