export function linearMapping(src1: number, src2: number, dst1: number, dst2: number): (arg: number) => number {
    const a = (dst2 - dst1) / (src2 - src1);
    const b = (dst1 * src2 - dst2 * src1) / (src2 - src1);
    return (t) => a * t + b;
}
