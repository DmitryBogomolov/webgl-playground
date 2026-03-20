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

        warn: (message, ...args) => {
            const str = formatStr(message, ...args);
            h('WARNING' satisfies LogLevel, str);
            return str;
        },

        error: (message, ...args) => {
            let str: string;
            let err: Error;
            if (message instanceof Error) {
                str = `${String(message)}\n${message.stack}`;
                err = message;
            } else {
                str = formatStr(message, ...args);
                err = new Error(str);
            }
            h('ERROR' satisfies LogLevel, str);
            return err;
        },
    } satisfies Logger;
}

function prefixed(handler: LogHandler, prefix: string): LogHandler {
    return (level, message) => handler(level, `${prefix}: ${message}`);
}
