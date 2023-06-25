import type { Logger } from '../../common/logger.types';

export type BaseChannelHandler<T> = (message: T) => void;

export interface BaseChannelOptions<T> {
    readonly rootLogger?: Logger;
    readonly tag?: string;
    readonly carrier: MessagePort;
    readonly connectionId: number;
    readonly handler: BaseChannelHandler<T>;
    readonly sendBufferLimit?: number;
    readonly recvBufferLimit?: number;
    readonly flushDelay?: number;
}
