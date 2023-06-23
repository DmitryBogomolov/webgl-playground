import type { BackgroundChannelOptions } from './background-channel.types';
import { BaseChannel } from './base-channel';

export class BackgroundChannel<T> extends BaseChannel<T> {
    constructor(options: BackgroundChannelOptions) {
        super({ ...options, carrier: self as unknown as MessagePort });
    }
}
