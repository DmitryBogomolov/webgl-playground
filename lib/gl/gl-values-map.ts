// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GLValuesMap<T extends keyof any> = Readonly<Record<T, number>>;
