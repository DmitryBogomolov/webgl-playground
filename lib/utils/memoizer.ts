// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(func: T): T {
    let memoizedArgs: Parameters<T> = [] as unknown as Parameters<T>;
    let memoizedValue: ReturnType<T>;
    function memoizedFunc(...args: Parameters<T>): ReturnType<T> {
        if (!compareArgs(memoizedArgs, args)) {
            memoizedArgs = args;
            memoizedValue = func(...memoizedArgs) as ReturnType<T>;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return memoizedValue;
    }
    return memoizedFunc as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compareArgs<TArgs extends any[]>(args1: TArgs, args2: TArgs): boolean {
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
