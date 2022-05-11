// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToArray<T> = T extends any[] ? T : [T];

export type EventListener<T = []> = (...args: ToArray<T>) => void;

export class EventEmitter<T = []> {
    private readonly _listeners: EventListener<T>[] = [];

    on(listener: EventListener<T>): this {
        this._listeners.push(listener);
        return this;
    }

    off(listener: EventListener<T>): this {
        const i = this._listeners.indexOf(listener);
        if (i >= 0) {
            this._listeners.splice(i, 1);
        }
        return this;
    }

    emit(...args: ToArray<T>): this {
        for (const listener of this._listeners) {
            listener(...args);
        }
        return this;
    }

    count(): number {
        return this._listeners.length;
    }

    clear(): this {
        this._listeners.length = 0;
        return this;
    }
}
