import type { BackgroundChannelParams } from './background-channel.types';
import { BaseChannel } from './base-channel';

export class BackgroundChannel<SendT, RecvT> extends BaseChannel<SendT, RecvT> {
    constructor(options: BackgroundChannelParams<RecvT>) {
        super({ ...options, carrier: wrapWorkerContext() });
    }
}

function wrapWorkerContext(): MessagePort {
    return Object.assign(self, {
        start() {
            // Does nothing.
        },
        close() {
            // Does nothing.
        },
    }) as MessagePort;
}
