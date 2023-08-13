import type { BaseChannelParams } from './base-channel.types';

export type BackgroundChannelParams<T> = Omit<BaseChannelParams<T>, 'carrier'>;
