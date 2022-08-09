export function memoize<T extends (...args: readonly unknown[]) => unknown>(func: T): T {
    let memoizedArgs: Parameters<T> = [] as unknown as Parameters<T>;
    let memoizedValue: ReturnType<T>;
    function memoizedFunc(...args: Parameters<T>): ReturnType<T> {
        if (!compareArgs(memoizedArgs, args)) {
            memoizedArgs = args;
            memoizedValue = func(...memoizedArgs) as ReturnType<T>;
        }
        return memoizedValue;
    }
    return memoizedFunc as T;
}

function compareArgs<TArgs extends readonly unknown[]>(args1: TArgs, args2: TArgs): boolean {
    if (args1.length !== args2.length) {
        return false;
    }
    for (let i = 0; i < args1.length; ++i) {
        if (args1[i] !== args2[i]) {
            return false;
        }
    }
    return true;
}
