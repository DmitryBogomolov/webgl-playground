import type { Logger, LogEntry, LOG_LEVEL, LogTransport } from './logger.types';
import type { Mapping } from './mapping.types';

export class LoggerImpl implements Logger {
    private readonly _transports: LogTransport[] = [];

    private _log(level: LOG_LEVEL, message: string): void {
        const timestamp = new Date();
        const entry: LogEntry = { timestamp, level, message };
        for (const transport of this._transports) {
            transport.log(entry);
        }
    }

    info(message: string): void {
        this._log('info', message);
    }

    warn(message: string): void {
        this._log('warn', message);
    }

    error(message: string): void {
        this._log('error', message);
    }

    addTransport(transport: LogTransport): void {
        const idx = this._transports.indexOf(transport);
        if (idx === -1) {
            this._transports.push(transport);
        }
    }

    removeTransport(transport: LogTransport): void {
        const idx = this._transports.indexOf(transport);
        if (idx !== -1) {
            this._transports.splice(idx, 1);
        }
    }
}

const levelToConsole: Mapping<LOG_LEVEL, (msg: string) => void> = {
    'info': (msg) => console.log(msg),
    'warn': (msg) => console.warn(msg),
    'error': (msg) => console.error(msg),
};

export class ConsoleLogTransport implements LogTransport {
    log(entry: LogEntry): void {
        levelToConsole[entry.level](entry.message);
    }
}
