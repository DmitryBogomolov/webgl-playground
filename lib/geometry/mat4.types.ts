export interface Mat4 extends Iterable<number> {
    readonly [i: number]: number;
}

export interface Mat4Mut extends Iterable<number> {
    [i: number]: number;
    readonly _NO_IMPLICIT_MAT4_CAST: null;
}
