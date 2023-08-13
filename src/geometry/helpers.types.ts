// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunc = (...args: readonly any[]) => any;

type SkipLast<T> = T extends [...args: infer P, last?: unknown] ? P : never;
export type SkipLastArg<T extends AnyFunc> = SkipLast<Parameters<T>>;
