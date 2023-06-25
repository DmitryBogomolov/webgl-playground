import type { BaseChannelOptions } from './base-channel.types';

export type BackgroundChannelOptions<T> = Omit<BaseChannelOptions<T>, 'carrier'>;
