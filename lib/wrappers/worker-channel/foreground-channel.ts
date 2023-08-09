import type { ForegroundChannelParams } from './foreground-channel.types';
import { BaseChannel } from './base-channel';

export class ForegroundChannel<SendT, RecvT> extends BaseChannel<SendT, RecvT> {
    constructor(options: ForegroundChannelParams<RecvT>) {
        super({ ...options, carrier: wrapWorker(options.worker) });
    }
}

function wrapWorker(worker: Worker | string): MessagePort {
    const isOwnWorker = !(worker instanceof Worker);
    const instance = isOwnWorker ? new Worker(worker) : worker;
    return Object.assign(instance, {
        start() {
            // Does nothing.
        },
        close() {
            if (isOwnWorker) {
                (this as unknown as Worker).terminate();
            }
        },
    }) as MessagePort;
}
