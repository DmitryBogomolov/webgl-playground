import type { Logger } from '../../common/logger.types';

export interface BaseChannelOptions {
    readonly carrier: MessagePort;
    readonly id: number;
    readonly rootLogger?: Logger;
    readonly tag?: string;
}
