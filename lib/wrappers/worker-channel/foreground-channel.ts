import type { ForegroundChannelOptions } from './foreground-channel.types';
import { BaseChannel } from './base-channel';

export class ForegroundChannel<T> extends BaseChannel<T> {
    constructor(options: ForegroundChannelOptions) {
        super({ ...options, carrier: options.worker as unknown as MessagePort });
    }
}
