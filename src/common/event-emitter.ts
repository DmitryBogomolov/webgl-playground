import type { EventHandler, EventProxy } from './event-emitter.types';

export class EventEmitter<T extends readonly unknown[] = []> implements EventProxy<T> {
    private readonly _handlers: EventHandler<T>[] = [];
    private readonly _proxy: EventProxy<T> = {
        on: (handler) => {
            this.on(handler);
            return this._proxy;
        },
        off: (handler) => {
            this.off(handler);
            return this._proxy;
        },
    };
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

    reset(): this {
        this._handlers.length = 0;
        this._emitHandlers = null;
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
