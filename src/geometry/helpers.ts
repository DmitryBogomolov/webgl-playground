export function range<T>(size: number, func: (idx: number) => T | null): ReadonlyArray<T> {
    return Array.from({ length: size }, (_, i) => func(i)).filter((t) => t !== null) as T[];
}

export function rowcol2idxRank(matRank: number, row: number, col: number): number {
    return (col * matRank + row) | 0;
}

export function idx2rowcolRank(matRank: number, idx: number): Readonly<{ row: number; col: number }> {
    return { row: (idx % matRank) | 0, col: (idx / matRank) | 0 };
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
