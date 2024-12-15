export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

export interface BaseObjectParams {
    readonly logger?: Logger;
    readonly name?: string;
    readonly tag?: string;
}
