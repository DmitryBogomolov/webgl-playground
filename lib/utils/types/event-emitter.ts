export interface EventHandler<T extends readonly unknown[] = []> {
    (...args: T): void;
}

export interface EventProxy<T extends readonly unknown[] = []> {
    on(handler: EventHandler<T>): this;
    off(handler: EventHandler<T>): this;
}
