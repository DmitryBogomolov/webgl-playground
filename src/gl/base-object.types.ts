import type { Logger } from '../common/logger_ex.types';

export interface BaseObjectParams {
    readonly logger?: Logger;
    readonly name?: string;
    readonly tag?: string;
}
