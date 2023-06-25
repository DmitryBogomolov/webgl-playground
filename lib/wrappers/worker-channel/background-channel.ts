import type { BackgroundChannelOptions } from './background-channel.types';
import { BaseChannel } from './base-channel';

export class BackgroundChannel<SendT, RecvT> extends BaseChannel<SendT, RecvT> {
    constructor(options: BackgroundChannelOptions<RecvT>) {
        super({ ...options, carrier: wrapWorkerContext() });
    }
}

function wrapWorkerContext(): MessagePort {
    return {
        ...self,
        start() {
            // Does nothing.
        },
        close() {
            // Does nothing.
        },
    } as MessagePort;
}
