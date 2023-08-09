import type { BaseChannelParams } from './base-channel.types';

export type ForegroundChannelParams<T> = Omit<BaseChannelParams<T>, 'carrier'> & {
    readonly worker: Worker | string;
};
