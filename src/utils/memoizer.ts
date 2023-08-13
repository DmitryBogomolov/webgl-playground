import { compareArrays } from './compare';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoize<T extends (...args: any[]) => any>(
    func: T,
    compareArgs: (lhs: Parameters<T>, rhs: Parameters<T>) => boolean = compareArrays,
): T {
    let memoizedArgs: Parameters<T> = null as unknown as Parameters<T>;
    let memoizedValue: ReturnType<T>;
    function memoizedFunc(...args: Parameters<T>): ReturnType<T> {
        if (!memoizedArgs || !compareArgs(memoizedArgs, args)) {
            memoizedArgs = args;
            memoizedValue = func(...memoizedArgs) as ReturnType<T>;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return memoizedValue;
    }
    return memoizedFunc as T;
}
