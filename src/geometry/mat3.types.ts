export type Mat3 = Readonly<[
    number, number, number,
    number, number, number,
    number, number, number,
]>;

export type Mat3Mut = [
    number, number, number,
    number, number, number,
    number, number, number,
] & {
    readonly _NO_IMPLICIT_MAT3_CAST: null;
};
