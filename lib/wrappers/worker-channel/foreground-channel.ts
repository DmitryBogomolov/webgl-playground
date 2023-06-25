import type { ForegroundChannelOptions } from './foreground-channel.types';
import { BaseChannel } from './base-channel';

export class ForegroundChannel<SendT, RecvT> extends BaseChannel<SendT, RecvT> {
    constructor(options: ForegroundChannelOptions<RecvT>) {
        super({ ...options, carrier: wrapWorker(options.worker) });
    }
}

function wrapWorker(worker: Worker | string): MessagePort {
    const instance = worker instanceof Worker ? worker : new Worker(worker);
    return {
        ...instance,
        start() {
            // Does nothing.
        },
        close() {
            instance.terminate();
        },
    } as MessagePort;
}
