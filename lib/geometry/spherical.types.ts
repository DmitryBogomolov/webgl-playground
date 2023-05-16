export interface Spherical {
    readonly azimuth: number;
    readonly elevation: number;
}

export interface SphericalMut {
    azimuth: number;
    elevation: number;
    readonly _NO_CAST: null;
}
