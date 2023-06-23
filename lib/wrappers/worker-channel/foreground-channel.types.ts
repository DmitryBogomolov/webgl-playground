import type { BaseChannelOptions } from './base-channel.types';

export type ForegroundChannelOptions = Pick<BaseChannelOptions, 'id' | 'rootLogger' | 'tag'> & {
    readonly worker: Worker;
}
