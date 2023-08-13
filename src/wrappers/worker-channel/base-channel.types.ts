import type { BaseObjectParams } from '../../gl/base-object.types';

export interface SendMessageOptions {
    readonly transferables?: ReadonlyArray<Transferable>;
    readonly immediate?: boolean;
}

export type BaseChannelMessageHandler<T> = (message: T) => void;

export interface BaseChannelParams<T> extends BaseObjectParams {
    readonly carrier: MessagePort;
    readonly connectionId: number;
    readonly handler: BaseChannelMessageHandler<T>;
    readonly sendBufferSize?: number;
    readonly recvQueueSize?: number;
    readonly flushDelay?: number;
}
