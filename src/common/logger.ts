import type { LogHandler, Logger, LogLevel, LogParams } from './logger.types';
import { formatStr } from '../utils/string-formatter';

export function logger(handler: LogHandler, params?: LogParams): Logger {
    const h = params?.prefix !== undefined ? prefixed(handler, params.prefix) : handler;
    return {
        handler,

        info: (message, ...args) => {
            const str = formatStr(message, ...args);
            h('INFO' satisfies LogLevel, str);
            return str;
        },

        warn: (message: string, ...args: unknown[]) => {
            const str = formatStr(message, ...args);
            h('WARNING' satisfies LogLevel, str);
            return str;
        },

        error: (message: string | Error, ...args: unknown[]) => {
            let str;
            if (message instanceof Error) {
                str = `${String(message)}\n${message.stack}`;
            } else {
                str = formatStr(message, ...args);
            }
            h('ERROR' satisfies LogLevel, str);
            return str;
        },
    };
}

function prefixed(handler: LogHandler, prefix: string): LogHandler {
    return (level, message) => handler(level, `${prefix}: ${message}`);
}
