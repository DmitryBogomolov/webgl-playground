export type Mat2 = Readonly<[
    number, number,
    number, number,
]>;

export type Mat2Mut = [
    number, number,
    number, number,
] & {
    readonly _NO_IMPLICIT_MAT2_CAST: null;
};
