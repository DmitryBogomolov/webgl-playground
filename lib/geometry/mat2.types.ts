export interface Mat2 extends Iterable<number> {
    readonly [i: number]: number;
}

export interface Mat2Mut extends Iterable<number> {
    [i: number]: number;
    readonly _NO_IMPLICIT_MAT2_CAST: null;
}
