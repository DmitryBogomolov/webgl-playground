export interface Mat3 extends Iterable<number> {
    readonly [i: number]: number;
}

export interface Mat3Mut extends Iterable<number> {
    [i: number]: number;
    readonly _NO_CAST: null;
}
