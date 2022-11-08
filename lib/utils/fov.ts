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
