export interface Mat3 extends ReadonlyArray<number> {
    readonly [i: number]: number;
}

export interface Mat3Mut extends Array<number> {
    [i: number]: number;
    readonly _NO_CAST: null;
}
