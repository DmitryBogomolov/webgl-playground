export interface Mat4 extends ReadonlyArray<number> {
    readonly [i: number]: number;
}

export interface Mat4Mut extends Array<number> {
    [i: number]: number;
    readonly _NO_CAST: null;
}
