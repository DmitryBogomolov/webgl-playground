export function arraysEqual<T extends readonly unknown[]>(
    lhs: T,
    rhs: T,
    compareItem: (lhs: unknown, rhs: unknown) => boolean = equalRef,
): boolean {
    if (lhs === rhs) {
        return true;
    }
    if (!lhs || !rhs || lhs.length !== rhs.length) {
        return false;
    }
    for (let i = 0; i < lhs.length; ++i) {
        if (!compareItem(lhs[i], rhs[i])) {
            return false;
        }
    }
    return true;
}

export function shallowEqual(
    lhs: object,
    rhs: object,
    compareField: (lhs: unknown, rhs: unknown) => boolean = equalRef,
): boolean {
    if (lhs === rhs) {
        return true;
    }
    if (!lhs || !rhs) {
        return false;
    }
    const keys = Object.keys(lhs);
    if (keys.length !== Object.keys(rhs).length) {
        return false;
    }
    for (const key of keys) {
        if (!compareField(lhs[key as keyof object], rhs[key as keyof object])) {
            return false;
        }
    }
    return true;
}

function equalRef<T>(lhs: T, rhs: T): boolean {
    return lhs === rhs;
}
