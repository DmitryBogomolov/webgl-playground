export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export type LOG_LEVEL = ('info' | 'warn' | 'error');

export interface LogEntry {
    readonly timestamp: Date;
    readonly level: LOG_LEVEL;
    readonly message: string;
}

export interface LogTransport {
    log(entry: LogEntry): void;
}
