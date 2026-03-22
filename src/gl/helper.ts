import type { Logger, LogHandler } from '../common/logger.types';
import { logger } from '../common/logger';

let next = 0;

const MAX = 0xFFFF;
const LEN = MAX.toString(16).length;

function uniqueId(): string {
    const id = next + 1;
    next = (next + 1) % (MAX - 1);
    return id.toString(16).padStart(LEN, '0');
}

export function makeTag(name: string, tag: string | undefined): string {
    return `${name}#${tag ?? uniqueId()}`;
}

export function makeLog(log: LogHandler | undefined, tag: string): Logger {
    return logger(log ?? (() => void 0), { prefix: tag });
}
