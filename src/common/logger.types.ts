export type LogHandler = (level: string, message: string) => void;

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export interface LogParams {
    readonly prefix?: string;
}

export interface Logger {
    readonly handler: LogHandler;
    readonly info: (message: string, ...args: unknown[]) => void;
    readonly warn: (message: string, ...args: unknown[]) => void;
    readonly error: (message: string | Error, ...args: unknown[]) => Error;
}
