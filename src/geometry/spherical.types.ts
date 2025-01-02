export interface Spherical {
    readonly distance: number;
    readonly azimuth: number;
    readonly elevation: number;
}

export interface SphericalMut {
    distance: number;
    azimuth: number;
    elevation: number;
    readonly _NO_IMPLICIT_SPHERICAL_CAST: null;
}
