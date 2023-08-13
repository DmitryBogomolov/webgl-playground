const DEG_RAD = 180 / Math.PI;

export function deg2rad(deg: number): number {
    return deg / DEG_RAD;
}

export function rad2deg(rad: number): number {
    return rad * DEG_RAD;
}
