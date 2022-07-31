const DEG_RAD = 180 / Math.PI;

export function deg2rad(deg: number): number {
    return deg / DEG_RAD;
}

export function rad2deg(rad: number): number {
    return rad * DEG_RAD;
}

/**
 * For a Field of View triangle calculates distance (height) for a given size (base).
 * b / 2 = h * tan (FOV / 2) <=> b = h * 2 * tan(FOV / 2)
 */
export function fovSize2Dist(fov: number, size: number): number {
    return size / 2 / Math.tan(fov / 2);
}

/**
 * For a Field of View triangle calculates size (base) for a given distance (height).
 * b / 2 = h * tan (FOV / 2) <=> h = b / 2 / tan(FOV / 2)
 */
export function fovDist2Size(fov: number, dist: number): number {
    return dist * 2 * Math.tan(fov / 2);
}

export function linearMapping(
    from1: number, from2: number, to1: number, to2: number,
): (arg: number) => number {
    const a = (to2 - to1) / (from2 - from1);
    const b = (to1 * from2 - to2 * from1) / (from2 - from1);
    return (t) => a * t + b;
}

