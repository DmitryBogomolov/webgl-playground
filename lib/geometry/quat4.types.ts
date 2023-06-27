export interface Quat4 {
    readonly qw: number;
    readonly qx: number;
    readonly qy: number;
    readonly qz: number;
}

export interface Quat4Mut {
    qx: number;
    qy: number;
    qz: number;
    qw: number;
    readonly _NO_IMPLICIT_QUAT4_CAST: null;
}
