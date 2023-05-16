export interface Mat2 extends ReadonlyArray<number> {
    readonly [i: number]: number;
}

export interface Mat2Mut extends Array<number> {
    [i: number]: number;
    readonly _NO_CAST: null;
}
