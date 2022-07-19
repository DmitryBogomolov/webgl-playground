const DEG_RAD = 180 / Math.PI;

export function deg2rad(deg: number): number {
    return deg / DEG_RAD;
}

export function rad2deg(rad: number): number {
    return rad * DEG_RAD;
}

export function linearMapping(from1: number, from2: number, to1: number, to2: number): (arg: number) => number {
    const a = (to2 - to1) / (from2 - from1);
    const b = (to1 * from2 - to2 * from1) / (from2 - from1);
    return (t) => a * t + b;
}
