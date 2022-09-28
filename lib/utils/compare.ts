export function compareArrays<T extends readonly unknown[]>(
    lhs: T, rhs: T, compareItem: (lhs: unknown, rhs: unknown) => boolean = (lhs, rhs) => lhs === rhs,
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

export function compareObjects(
    lhs: object, rhs: object, compareField: (lhs: unknown, rhs: unknown) => boolean = (lhs, rhs) => lhs === rhs,
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
