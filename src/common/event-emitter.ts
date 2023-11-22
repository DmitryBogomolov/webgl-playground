import type { EventHandler, EventProxy } from './event-emitter.types';

export class EventEmitter<T extends readonly unknown[] = []> implements EventProxy<T> {
    private readonly _handlers: EventHandler<T>[] = [];
    private readonly _proxy = new EventProxyImpl<T>(this);
    private _emitHandlers: EventHandler<T>[] | null = null;

    proxy(): EventProxy<T> {
        return this._proxy;
    }

    on(handler: EventHandler<T>): this {
        this._handlers.push(handler);
        this._emitHandlers = null;
        return this;
    }

    off(handler: EventHandler<T>): this {
        const i = this._handlers.indexOf(handler);
        if (i >= 0) {
            this._handlers.splice(i, 1);
            this._emitHandlers = null;
        }
        return this;
    }

    emit(...args: T): this {
        if (!this._emitHandlers) {
            this._emitHandlers = this._handlers.slice();
        }
        for (const handler of this._emitHandlers) {
            handler(...args);
        }
        return this;
    }

    count(): number {
        return this._handlers.length;
    }

    clear(): this {
        this._handlers.length = 0;
        this._emitHandlers = null;
        return this;
    }
}

class EventProxyImpl<T extends readonly unknown[]> implements EventProxy<T> {
    private readonly _emitter: EventEmitter<T>;

    constructor(emitter: EventEmitter<T>) {
        this._emitter = emitter;
    }

    on(handler: EventHandler<T>): this {
        this._emitter.on(handler);
        return this;
    }

    off(handler: EventHandler<T>): this {
        this._emitter.off(handler);
        return this;
    }
}

export function eventOnce<T extends readonly unknown[] = []>(
    proxy: EventProxy<T>, handler: EventHandler<T>,
): () => void {
    const wrapper: EventHandler<T> = (...args) => {
        proxy.off(wrapper);
        handler(...args);
    };
    proxy.on(wrapper);
    return () => {
        proxy.off(wrapper);
    };
}

export function eventWait<T extends readonly unknown[] = []>(proxy: EventProxy<T>): Promise<T> {
    return new Promise<T>((resolve) => {
        const wrapper: EventHandler<T> = (...args) => {
            proxy.off(wrapper);
            resolve(args);
        };
        proxy.on(wrapper);
    });
}
