export interface EventHandler<T extends readonly unknown[] = []> {
    (...args: T): void;
}

export class EventEmitter<T extends readonly unknown[] = []> {
    private readonly _handlers: EventHandler<T>[] = [];

    on(handler: EventHandler<T>): this {
        this._handlers.push(handler);
        return this;
    }

    off(handler: EventHandler<T>): this {
        const i = this._handlers.indexOf(handler);
        if (i >= 0) {
            this._handlers.splice(i, 1);
        }
        return this;
    }

    emit(...args: T): this {
        for (const handler of this._handlers) {
            handler(...args);
        }
        return this;
    }

    count(): number {
        return this._handlers.length;
    }

    clear(): this {
        this._handlers.length = 0;
        return this;
    }
}
