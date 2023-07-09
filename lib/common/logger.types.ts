export interface Logger {
    log(format: string, ...params: unknown[]): string;
    warn(format: string, ...params: unknown[]): string;
    error(format: string | Error, ...params: unknown[]): Error;
}

export interface LoggerDriver {
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
