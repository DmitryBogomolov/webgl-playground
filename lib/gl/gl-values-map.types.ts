import type { Mapping } from '../common/mapping.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GLValuesMap<T extends keyof any> = Mapping<T, number>;
