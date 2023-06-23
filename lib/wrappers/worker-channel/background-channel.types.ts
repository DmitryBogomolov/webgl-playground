import type { BaseChannelOptions } from './base-channel.types';

export type BackgroundChannelOptions = Pick<BaseChannelOptions, 'id' | 'rootLogger' | 'tag'>;
