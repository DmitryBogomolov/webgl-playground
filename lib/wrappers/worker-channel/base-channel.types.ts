import type { Logger } from '../../common/logger.types';

export interface SendMessageOptions {
    readonly transferables?: ReadonlyArray<Transferable>;
    readonly immediate?: boolean;
}

export type BaseChannelMessageHandler<T> = (message: T) => void;

export interface BaseChannelOptions<T> {
    readonly rootLogger?: Logger;
    readonly tag?: string;
    readonly carrier: MessagePort;
    readonly connectionId: number;
    readonly handler: BaseChannelMessageHandler<T>;
    readonly sendBufferLimit?: number;
    readonly recvBufferLimit?: number;
    readonly flushDelay?: number;
}
