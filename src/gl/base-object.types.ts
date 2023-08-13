import type { Logger } from '../common/logger.types';

export interface BaseObjectParams {
    readonly logger?: Logger;
    readonly name?: string;
    readonly tag?: string;
}
