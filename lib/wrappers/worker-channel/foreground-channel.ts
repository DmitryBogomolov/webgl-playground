import type { ForegroundChannelOptions } from './foreground-channel.types';
import { BaseChannel } from './base-channel';

export class ForegroundChannel<SendT, RecvT> extends BaseChannel<SendT, RecvT> {
    constructor(options: ForegroundChannelOptions<RecvT>) {
        super({ ...options, carrier: wrapWorker(options.worker) });
    }
}

function wrapWorker(worker: Worker): MessagePort {
    return {
        ...worker,
        start() {
            // Does nothing.
        },
        close() {
            worker.terminate();
        },
    } as MessagePort;
}
