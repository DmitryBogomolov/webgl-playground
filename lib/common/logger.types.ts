export interface Logger {
    info(format: string, ...params: unknown[]): string;
    warn(format: string, ...params: unknown[]): string;
    error(format: string | Error, ...params: unknown[]): Error;
}

export interface LoggerDriver {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
