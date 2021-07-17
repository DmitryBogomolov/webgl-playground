import { CancelSubscriptionCallback } from './cancel-subscription-callback';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToArray<T> = T extends any[] ? T : [T];

export type EventListener<T> = (...args: ToArray<T>) => void;

export class EventEmitter<T = []> {
    private readonly _listeners: EventListener<T>[] = [];

    on(listener: EventListener<T>): CancelSubscriptionCallback {
        const i = this._listeners.indexOf(listener);
        if (i >= 0) {
            return noop;
        }
        this._listeners.push(listener);
        return () => {
            const i = this._listeners.indexOf(listener);
            if (i < 0) {
                return;
            }
            this._listeners.splice(i, 1);
        };
    }

    emit(...args: ToArray<T>): void {
        for (const listener of this._listeners) {
            listener(...args);
        }
    }

    clear(): void {
        this._listeners.length = 0;
    }
}

function noop(): void { /* empty */ }
