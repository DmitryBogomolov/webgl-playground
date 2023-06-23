import type { BaseChannelOptions } from './base-channel.types';
import { BaseDisposable } from '../../common/base-disposable';

export abstract class BaseChannel<T> extends BaseDisposable {
    private readonly _carrier: MessagePort;
    private readonly _connectionId: number;

    constructor(options: BaseChannelOptions) {
        super(options.rootLogger || null, options.tag);
        this._logger.log('init');
        this._carrier = options.carrier;
        this._connectionId = options.id;
    }

    dispose(): void {
        this._logger.log('dispose');
        this._carrier.close();
        this._dispose();
    }

    send(message: T): void {

    }

    recv(): T | null {
        return null;
    }
}
