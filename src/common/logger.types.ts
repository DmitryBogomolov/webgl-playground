export type LogHandler = (level: string, message: string) => void;

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export interface LogParams {
    readonly prefix?: string;
}

export interface Logger {
    readonly handler: LogHandler;
    info(message: string, ...args: unknown[]): string;
    warn(message: string, ...args: unknown[]): string;
    error(err: Error): string;
    error(message: string, ...args: unknown[]): string;
}
