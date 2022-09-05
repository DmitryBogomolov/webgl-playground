import { EventHandler, EventProxy } from './types/event-emitter';

export class EventEmitter<T extends readonly unknown[] = []> implements EventProxy<T> {
    private readonly _handlers: EventHandler<T>[] = [];
    private readonly _proxy = new EventProxyImpl<T>(this);
    private readonly _handlerAdded: (handler: EventHandler<T>) => void;

    constructor(handlerAdded?: (handler: EventHandler<T>) => void) {
        this._handlerAdded = handlerAdded || (() => { /* nothing */ });
    }

    proxy(): EventProxy<T> {
        return this._proxy;
    }

    on(handler: EventHandler<T>): this {
        this._handlers.push(handler);
        this._handlerAdded(handler);
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
