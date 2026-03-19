import type { LogHandler } from '../common/logger.types';

export interface BaseObjectParams {
    readonly logger?: LogHandler;
    readonly name?: string;
    readonly tag?: string;
}
