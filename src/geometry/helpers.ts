// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function range<T extends (idx: number) => any>(
    size: number, func: T,
): ReadonlyArray<NonNullable<ReturnType<T>>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array<number>(size).fill(0).map((_, i) => func(i)).filter((t) => t !== null);
}

export function rowcol2idxRank(matRank: number, row: number, col: number): number {
    return col * matRank + row;
}

export function idx2rowcolRank(matRank: number, idx: number): [number, number] {
    return [idx % matRank, (idx / matRank) | 0];
}

export function excludeRowColRank(matRank: number, row: number, col: number): number[] {
    const ret = Array<number>((matRank - 1) ** 2);
    let k = 0;
    for (let i = 0; i < matRank; ++i) {
        if (i === row) {
            continue;
        }
        for (let j = 0; j < matRank; ++j) {
            if (j === col) {
                continue;
            }
            ret[k++] = rowcol2idxRank(matRank, i, j);
        }
    }
    return ret;
}
