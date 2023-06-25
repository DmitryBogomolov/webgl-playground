import type { BaseChannelOptions } from './base-channel.types';

export type ForegroundChannelOptions<T> = Omit<BaseChannelOptions<T>, 'carrier'> & {
    readonly worker: Worker | string;
};
